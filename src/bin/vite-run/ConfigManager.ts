import {
  findDuplicates,
  isFunction,
  printErrorLog,
  readLocalViteRunConfig,
  selfConfigFields
} from "@/bin/vite-run/common";
import {configItemType, ViteRunHandleFunctionOptions, ViteRunOptions} from "@/types";
import colors from "picocolors";
import {globSync} from "glob";
import {mergeConfig} from "vite";
import {basename, resolve} from "node:path";
import process from "node:process";
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
    if (!config){
      printErrorLog('No configuration with name' + name + 'found in configuration', true)
    }
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
      printErrorLog(
        `The following ${repeatField.length} names have naming conflicts in the configuration: ${repeatField}`
        , isExit)
    }
  }

  private extractAllConfigItem() {
    for (const viteFieldName in this.config) {
      const items = this.config[viteFieldName]
      if (typeof items !== 'object'){
        printErrorLog(
          ` The ${viteFieldName} field should be a normal js native object, check to see if it is defined`
          , true)
      }
      for (const configName in items) {
        this.allConfigItem[configName] = {
          viteName: viteFieldName,   // vite config中的顶层字段，比如build , mode, publicDir 等
          value: items[configName]   // 配置名和对应值
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
          console.log(colors.red(
            'When defining packages path matching, ' +
            'only the trailing asterisk is allowed to match. Please check your packages definition: ' + packagePart));
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
  private mergeConfigs(...args: any[]): Record<any, any> {
    let result = {}
    if (args.length === 0){
      printErrorLog(colors.red('An empty array exists in the targets configuration'), true)
    }

    for (const k in args) {
      const configData = args[k]
      result = mergeConfig(result, configData, false)
    }
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
      const target /* 某个app的target配置对象 */ = targets[appName]
      if (!allAppName.includes(appName)) {
        console.log(colors.red(`${appName}
      Does not exist in the file system`))
        process.exit(-1)
      }
      if (!target) continue
      let execConfigs: [] = target[scriptType]
      if (execConfigs && !Array.isArray(execConfigs)) {
        printErrorLog(`  targets ${appName}.${scriptType} It should be an array`, true)
      }
      allowTargetMap[appAbsolutePath] = []
      for (let group: string | string[] of execConfigs) {
        if (!Array.isArray(group)) group = [group]
        let groupConfigList = []
        for (const configName of group) {
          if (!configName) {
            printErrorLog(
              'There is an empty definition in the array of targets configured with the value undefined'
              , true)
          }
          const configInfo = this.getConfig(configName)
          let customConfig = configInfo.value
          if (isFunction(customConfig)) {
            customConfig = await this.getRealConfig(appAbsolutePath, <object>customConfig)
          }
          groupConfigList.push({
            [configInfo.viteName]: customConfig
          })
        }
        const customDefinePart = this.mergeConfigs.apply(<object>this, groupConfigList)
        // console.log(customDefinePart);
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
      }
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
      const {type, config: customDefinePart} = configInfo
      const viteFullCustomConfig = mergeConfig(realBaseConfig, customDefinePart)
      viteFullCustomConfig.viteRun = {
        ...configInfo
      }
      // console.log(viteFullCustomConfig);
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
