import {
  findDuplicates,
  isFunction,
  printErrorLog,
  readLocalViteRunConfig,
  selfConfigFields
} from "@/bin/vite-run/common";
import colors from "picocolors";
import {configItemType, ViteRunHandleFunctionOptions, ViteRunOptions} from "@/types";
import process from "node:process";
import {globSync} from "glob";
import {basename, resolve} from "node:path";
import {mergeConfig} from "vite";
import {patchToViteEngine} from "@/bin/vite-run/patch";

export class ConfigManager {
  /** 完整的外部config */
  readonly viteRunConfig: ViteRunOptions
  /** this.fullConfig 扣除viterun配置需要的几个字段后剩下的配置 */
  readonly config: Record<any, any>
  private allConfigItem: Record<string, configItemType> = {}

  /** 检查数组中是否有重复项 */
  constructor() {
    this.config = {}
    this.viteRunConfig = {}
  }

  /** 获取某个配置的值 */
  private getConfig(name: string): configItemType {
    const config = this.allConfigItem[name]
    if (!config) printErrorLog('在配置中没有找到名称为 ' + name + ' 的配置', true)
    return config
  }

  /** 获取用户定义的完整配置 */
  private getFullConfig(): Record<string, any> {
    return {
      ...this.config,
      ...this.viteRunConfig,
    }
  }

  /** 检查配置中是否有重复名称的配置 */
  private checkConfigRepeat(isExit: boolean = false) {
    const values = Object.values(this.config).map((item: any) => Object.keys(item)).flat()
    const repeatField = findDuplicates(values)
    if (repeatField.length) {
      console.log(repeatField);
      printErrorLog(`配置中有以下${repeatField.length}个名称命名冲突:  ${repeatField}`, isExit)
    }
  }

  private extractAllConfigItem() {
    for (const viteFieldName in this.config) {
      const items = this.config[viteFieldName]
      if (typeof items !== 'object') printErrorLog(`${viteFieldName} 字段应该是一个普通js对象`, true)
      for (const configName in items) {
        this.allConfigItem[configName] = {
          viteName: viteFieldName,
          value: items[configName]
        }
      }
    }
  }

  /** 初始化，必须先调用才能使用该工具 */
  public async init() {
    //@ts-ignore
    const fullConfig = <Record<any, any>>await readLocalViteRunConfig()
    for (const k in fullConfig) {
      const val = fullConfig[k]
      // @ts-ignore
      if (selfConfigFields.includes(k)) this.viteRunConfig[k] = val   // viteRun自有的配置
      else this.config[k] = val   // 属于vite可用的配置
    }
    this.checkConfigRepeat(true)
    this.extractAllConfigItem()
  }

  private async getAllLocalPackage() {
    const localConfig = await readLocalViteRunConfig()
    const {packages = []} = localConfig
    let allApp: string[] = []
    packages.forEach(packagePart => {
      if (packagePart.includes('*')) {  // 带有*号合法性检测， 防止比如 xx/**/** 全遍历某文件夹下所有文件
        const parts = packagePart.split('/')
        parts.pop()   // 只允许尾部带 * 号，先pop出再检测前面是否还带*号，如果带的话为不合法匹配
        if (parts.join('/').includes('*')) {
          console.log(colors.red('定义 packages 路径匹配的时候，只允许尾部带* 号匹配,请检查您的packages定义: ' + packagePart))
          process.exit(-1)
        }
        packagePart = packagePart.replaceAll(/\*+/gi, '*')  // 将检测后只有尾部带*的限制在一个,所以定义任意个最后都会被更改为1个
      }
      const foundApps = globSync(resolve(packagePart))
      allApp = allApp.concat(foundApps)
    })
    return allApp
  }

  /** 合并指定名称的config配置，传入allConfigItem中的名称，也就是外部定义的配置名 */
  private mergeConfigs(...args: string[]): Record<any, any> {
    let result = {}
    if (args.length === 0) printErrorLog(colors.red('在targets配置中存在空数组'), true)
    args.forEach((configName: string) => {
      if (!configName) printErrorLog('在targets配置的数组中存在空定义,值为 undefined', true)
      const configItem: configItemType = this.getConfig(configName)
      result = mergeConfig(result, {
        [configItem.viteName]: configItem.value
      })
    })
    return result
  }

  /**
   * @param {string} scriptType 命令行执行执行的规则名称，比如 targets: {app: {build:['es','umd']}} ,外部运行viterun build，此时的scriptType就是build
   * @param {string[]} allowApps 指定执行的app名称列表，如果没有指定，则表示默认是全部在target中定义的app
   *  */
  private async createConfigMap(scriptType: string, allowApps: string[] = []) {
    const allApp = await this.getAllLocalPackage()
    const allAppName = allApp.map(absolutePath => basename(absolutePath))
    const localConfig = this.getFullConfig()
    const {targets = {}} = localConfig
    let allowTargetMap: Record<any, any> = {}
    if (allowApps.length === 0) allowApps = Object.keys(targets).filter((appName: string) => {
      // 如果当前没有明确指定某几个app，则默认执行所有当前已经存在targets定义的app
      return targets[appName][scriptType]
    })
    for (let index in allowApps) {
      const appName = allowApps[index] // 外部用户targets中设定的相对主项目地址的能指向子包的字段路径
      const appAbsolutePath = <string>allApp.find(path => basename(path) === appName)
      const target = targets[appName]
      if (!allAppName.includes(appName)) {
        console.log(colors.red(`${appName} 在文件系统中不存在`))
        process.exit(-1)
      }
      if (!target) continue
      let execConfigs = target[scriptType]
      if (!execConfigs) continue
      if (!Array.isArray(execConfigs)) printErrorLog(`targets 中的${appName}.${scriptType}应该是一个数组`, true)
      allowTargetMap[appAbsolutePath] = []
      execConfigs.forEach((group: any) => {
        if (!Array.isArray(group)) group = [group]
        // console.log(group);
        const customDefinePart = this.mergeConfigs(...group)
        let type = 'build'   // 如果应用多个配置可能会同时存在不同操作，优先级 build > server > preview
        if (customDefinePart.build) type = 'build'
        else if (customDefinePart.server) type = 'server'
        else if (customDefinePart.preview) type = 'preview'
        allowTargetMap[appAbsolutePath].push({
          appName,
          group,
          type: type,
          config: customDefinePart
        })
      })
    }
    return allowTargetMap
  }


  /** 获取vite配置，传入对象的话原样返回，传入函数执行后获取返回对象 */
  private async getRealConfig(packagePath: string, viteConfigPart: Record<any, any> | Function, setup: { type?: string } = {}) {
    const rootPackagePath = resolve(process.cwd(), packagePath)  // 子包的根目录
    const localConfig = this.getFullConfig()
    let options = {}
    if (isFunction(viteConfigPart)) {
      options = {
        ...setup,
        name: packagePath.split('/').filter(Boolean).pop(),
        pathName: packagePath,
        packagePath: rootPackagePath,
      } as unknown as ViteRunHandleFunctionOptions
      //@ts-ignore
      viteConfigPart = await viteConfigPart.call(localConfig, options) // 当viteConfigPart是函数的时候执行获取配置，支持异步
    }
    return viteConfigPart as Record<any, any>
  }


  private async patchToTargets(absolutePath, patchConfigList) {
    const baseConfig = this.viteRunConfig.baseConfig || {}
    const realBaseConfig = await this.getRealConfig(absolutePath, <object>baseConfig)  // baseConfig是函数或对象，传入函数会执行获取返回配置对象
    realBaseConfig.root = resolve(process.cwd(), absolutePath)     // 子包的根目录重定向执行到配置root上
    for (const configInfo of patchConfigList) {
      const {type, config: customConfigMap} = configInfo
      for (const customConfigName in customConfigMap) {  // customConfigMap 是用户定义的配置组(group)合并后的配置，配置对象的结构类似UserConfig
        const customConfig = customConfigMap[customConfigName]
        if (isFunction(customConfig)) {
          customConfigMap[customConfigName] = await this.getRealConfig(absolutePath, <object>customConfigMap[customConfigName], {type})
        }
      }
      const viteFullCustomConfig = mergeConfig(realBaseConfig, customConfigMap)
      viteFullCustomConfig.viteRun = {
        ...configInfo
      }
      await patchToViteEngine(type, viteFullCustomConfig)
    }
  }

  /** 脚本派发入口函数，该类所有函数都只由该入口函数触发 */
  public async patch(scriptType: string, apps: [] = []) {
    const allowTargets = await this.createConfigMap(scriptType, apps)
    for (const absolutePath in allowTargets) {
      const packageUseConfigList = allowTargets[absolutePath]  // 获取某个子包当前scriptType下要执行的配置列表
      await this.patchToTargets(absolutePath, packageUseConfigList)
    }
  }
}
