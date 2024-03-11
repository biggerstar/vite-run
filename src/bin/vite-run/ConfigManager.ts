import {
  findDuplicates,
  isFunction,
  printErrorLog,
  readLocalViteRunConfig,
  selfConfigFields
} from "@/bin/vite-run/common";
import {BaseConfigType, configItemType, TargetMapInfo, ViteRunHandleFunctionOptions, ViteRunOptions} from "@/types";
import colors from "picocolors";
import {globSync} from "glob";
import {mergeConfig} from "vite";
import {basename, resolve} from "node:path";
import process from "node:process";
import {patchToViteEngine} from "@/bin/vite-run/patch";
import prompts from "@/bin/vite-run/inquirer";

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
    if (!config) {
      printErrorLog(`No configuration with name '${name}' found in configuration`, true)
    }
    return config
  }

  /**
   * 获取用户所定义 vite专属 + vite-run专属 的完整配置
   * */
  private getFullConfig(): Record<string, any> {
    return {
      ...this.config,
      ...this.viteRunConfig,
    }
  }

  /** 检查 target 配置中是否有重复名称的配置 */
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

  /**
   * 将所有的配置块提取出来放置到 this.allConfigItem 中
   * */
  private extractAllConfigItem() {
    for (const viteFieldName in this.config) {
      const items = this.config[viteFieldName]
      if (typeof items !== 'object') {
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

  /**
   * 初始化，必须先调用才能使用该工具
   * */
  public async init() {
    //@ts-ignore
    const fullConfig = <Record<any, any>>await readLocalViteRunConfig()
    for (const k in fullConfig) {
      const val = fullConfig[k]
      // @ts-ignore
      if (selfConfigFields.includes(k)) this.viteRunConfig[k] = val   // 过滤掉viteRun自有的配置
      else this.config[k] = val   // 属于vite可用的配置
    }
    this.checkConfigRepeat(true)
    this.extractAllConfigItem()
  }

  /**
   * 基于 packages 配置字段， 获取当前需要管理的所有的包路径
   * */
  private async getAllLocalPackage() {
    const localConfig = await readLocalViteRunConfig()
    const packages = isFunction(localConfig.packages) ? localConfig.packages.call(localConfig) : localConfig.packages  // 获取 packages 配置，如果是函数则获取真实配置对象
    let allApp: string[] = []
    packages.forEach((packagePart: string) => {
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
    if (args.length === 0) {
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
  private async createConfigMap(scriptType: string, allowApps: string[] = []): Promise<TargetMapInfo> {
    const allApp = await this.getAllLocalPackage()
    const allAppName = allApp.map(absolutePath => basename(absolutePath))
    const localConfig = this.getFullConfig()
    const targets = isFunction(localConfig.targets) ? localConfig.targets.call(localConfig) : localConfig.targets  // 获取targets配置，如果是函数则获取真实配置对象
    // console.log(targets)
    let allowTargetMap: Record<any, any> = {}
    if (allowApps.length === 0) allowApps = Object.keys(targets).filter((appName: string) => {
      // 如果当前没有明确指定某几个app，则默认执行所有当前已经存在targets定义的app
      return targets[appName][scriptType] || targets[appName][`@${scriptType}`]
    })
    if (allowApps.length === 0) {
      printErrorLog(`The '${scriptType}' configuration name was not found in targets`, true)
    }
    for (let index in allowApps) {
      /*-----------------------必要条件判定开始-------------------------*/
      const appName = allowApps[index] // 外部用户targets中设定的相对主项目地址的能指向子包的字段路径
      if (!allAppName.includes(appName)) {
        console.log(colors.red(`'${appName}' Does not exist in the file system`))
        process.exit(-1)
      }
      const target /* 某个app的target配置对象 */ = targets[appName]
      if (!target) continue
      /*-----------------------合成配置开始----------------------------*/
      const appAbsolutePath = <string>allApp.find(path => basename(path) === appName)
      let isRequire = false
      let execConfigs: any
      if (target[scriptType]) execConfigs = target[scriptType]
      else if (target[`@${scriptType}`]) {   // 添加了@前缀则认为该指令下是必然运行的app (只会在 vite-run XXX 无明确定义运行app下生效)
        execConfigs = target[`@${scriptType}`]
        isRequire = true
      }
      if (execConfigs && !Array.isArray(execConfigs)) {
        printErrorLog(`targets '${appName}.${scriptType}' It should be an array`, true)
      }
      allowTargetMap[appAbsolutePath] = {
        require: isRequire,
        apps: []
      }
      for (let group of execConfigs) {
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
            customConfig = await this.getRealConfigBlock(appAbsolutePath, <object>customConfig)
          }
          groupConfigList.push({
            [configInfo.viteName]: customConfig
          })
        }
        const customDefinePart = this.mergeConfigs.apply(<object>this, groupConfigList)
        // console.log(customDefinePart);
        let type = 'build'   // 如果应用多个配置可能会同时存在不同操作，优先级 build < server < preview
        if (customDefinePart.preview) type = 'preview'
        else if (customDefinePart.server) type = 'server'
        else if (customDefinePart.build) type = 'build'
        allowTargetMap[appAbsolutePath].apps.push({
          appName,
          group,
          type: type,
          config: customDefinePart
        })
      }
    }
    return allowTargetMap
  }


  /**
   * 获取vite配置块，
   * 情况1：传入对象的话原样返回，
   * 情况2：传入函数执行后获取返回对象
   * */
  private async getRealConfigBlock(packagePath: string, viteConfigBlock: Record<any, any> | Function, setup: {
    type?: string
  } = {}) {
    const rootPackagePath = resolve(process.cwd(), packagePath)  // 子包的根目录
    const localConfig = this.getFullConfig()
    let options = {}
    if (isFunction(viteConfigBlock)) {
      options = {
        ...setup,
        name: packagePath.split('/').filter(Boolean).pop(),
        pathName: packagePath,
        packagePath: rootPackagePath,
      } as unknown as ViteRunHandleFunctionOptions
      //@ts-ignore
      viteConfigBlock = await viteConfigBlock.call(localConfig, options) // 当 viteConfigBlock 是函数的时候执行获取配置，支持异步
    }
    return viteConfigBlock as Record<any, any>
  }


  private async patchToTargets(absolutePath: string, patchConfigList: any[]) {
    const baseConfig = this.viteRunConfig.baseConfig
    const realBaseConfig = await this.getRealConfigBlock(absolutePath, <object>baseConfig || {})  // baseConfig是函数或对象，传入函数会执行获取返回配置对象
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

  /** 脚本执行入口函数，该类所有函数都只由该入口函数触发 */
  public async patch(scriptType: string, apps: string[] = []) {
    let allowTargets = await this.createConfigMap(scriptType, apps)
    if (!apps.length) allowTargets = await this.inquirer(scriptType, allowTargets)
    for (const absolutePath in allowTargets) {
      const {apps: packageUseConfigList} = allowTargets[absolutePath]  // 获取某个子包当前scriptType下要执行的配置列表
      await this.patchToTargets(absolutePath, packageUseConfigList)
    }
  }

  /**
   * 如果没有在命令行中指定运行的应用， 且 参数2为 dev | build | preview 的特殊运行字段，如果有使用这几个字段将能支持调起控制台交互
   * */
  private async inquirer(scriptType: string, allowTargets: TargetMapInfo) {
    allowTargets = Object.assign({}, allowTargets)
    const handleAppList/* 手动选择运行的app */ = Object.values(allowTargets).filter(item => !item.require).map(item => item.apps[0].appName)
    const requireAppList/* 必然运行的app */ = Object.values(allowTargets).filter(item => item.require).map(item => item.apps[0].appName)
    const allAppList = handleAppList.concat(requireAppList)
    let widgetsList: any[] = []

    async function call(fn: Function) {
      const {widgets, allow} = await fn.call(null, allAppList, requireAppList)
      if (allow === 'select') widgetsList = widgets
      else if (allow === 'all') widgetsList = allAppList
      else if (allow === 'cancel') {
        console.log(colors.red(`\u274C `), ' 您取消了操作')
        process.exit(-1)
      }
      console.log(colors.gray(`➜ 当前使用微模块 ${widgetsList}`))
    }

    if (scriptType === 'dev') await call(prompts.dev)
    else if (scriptType === 'build') await call(prompts.build)
    else if (scriptType === 'preview') await call(prompts.preview)
    for (const k in allowTargets) {
      const targetList = allowTargets[k]
      if (!widgetsList.includes(targetList.apps[0].appName)) delete allowTargets[k]
    }
    // console.log(widgetsList, allowTargets)
    return allowTargets
  }
}
