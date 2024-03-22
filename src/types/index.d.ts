import {UserConfig} from "vite";


declare module 'vite' {
  export interface UserConfig {
    viteRun?: {
      appName: string
      group: Array<any>
      type: 'build' | 'preview' | 'server'
      config: Record<any, any>
    }
  }
}
// @start-copy

declare module 'viterun.config.*?' {
  //@ts-ignore
  import {ViteRunOptions} from "vite-run";
  export default ViteRunOptions
  export {}
}


/**   build : 打包编译模式，会使用vite配置的build
 /**  serve | dev: 服务器模式，会使用vite配置的server，dev 和 serve 表示都是同一个东西，类比 es 和 esm
 /**  preview : 预览模式，会使用vite配置的preview
 *    lib ： 是开发库的时候 在vite配置中使用 build.watch = {}， 实现监听文件修改自动重编译的模式 (只是约定，具体需要开发者自己添加watch，使用该字段不会输出build信息)
 *          在lib模式下如果有多个库同时运行，修改了一个库其他库也会变动是正常的，因为其他库监听了当前修改库的dist，重编译后其他依赖该库的都会更新
 * */

export type ViteRunSelfField = 'packages' | 'targets' | 'baseConfig'

export type BaseConfigType = BaseConfigReturnType | ((options: ViteRunHandleFunctionOptions) => BaseConfigReturnType)

export type BaseConfigReturnType =
  Promise<DeepPartial<DeepPartialViteUserConfig>>
  | DeepPartial<DeepPartialViteUserConfig>

export type DeepPartialViteUserConfig = DeepPartial<NoPluginsFiledUserConfig>
  & { plugins?: import('vite').Plugin[] }

/** targets下执行目标的类型，也就是命令行执行时 vite-run XXX 指向的对象,会提取当前用户已定义配置的名字，允许类型为字符串数组 */

export type TargetsOptions = Record<string, Record<string, Array<Array<string>>>>

/** 提取ts类型声明所有的值Values */
export type Values<T> = T[keyof T];
/** 允许任何字段 */
export type AnyRecord = {
  [key: string | number | symbol]: any
}


/** vite-run在项目根下创建的名为viterun.config的 js或者ts配置文件默认导出配置，也可以通过函数defineConfig获得类型提示 */
export type ViteRunSelfOptions<Options extends Record<any, any>> = {
  /** 所有configs规则共享的配置，在每个规则的formats打包的时候都会检查该对象，
   * 如果是一个函数的话会传入 ViteRunHandleFunctionOptions 类型的数据，
   * 之后该函数需要返回一个UserConfig类型用于vite的配置，用于和configs里面定义的配置进行合并
   *  */
  baseConfig?: BaseConfigType
  /** 需要管理包的位置，支持部分glob语法(只允许获取文件夹和非**匹配) */
  packages: Array<string>;
  /** 定义要操作包的位置和适用该包的规则，这里说的规则指的是在configs中定义的配置，
   * 编译的时候按上下文从上到下定义的顺序编译(因为可能后面的包依赖之前的包) */
  targets: TargetsOptions | (() => TargetsOptions)
}

/** plugins 字段的类型里面会无限嵌套，在DeepPartial类型检查的时候会出问题，单独拎出来处理 */
export type VitePluginFieldType =
  import('vite').Plugin[]
  | ((options: ViteRunHandleFunctionOptions) => import('vite').Plugin[])

/** ViteRun 的对象形式vite插件类型 */
export type ViteRunPluginOptions = {
  plugins?: Record<string, VitePluginFieldType>
}
/** viteRun  defineConfig函数入口对象的类型 */
export type ViteRunOptions<Options extends Record<any, any> = {}> =
  ToViteUserConfigs
  & ViteRunSelfOptions<Options>
  & ViteRunPluginOptions
  & AnyRecord

/** 去除plugins字段的vite UserConfig配置 */
export type NoPluginsFiledUserConfig = Omit<UserConfig, 'plugins'>

/** 将原本UserConfig中的单值类型转成Record形式的对象支持, 如果使用的是配置函数作为配置名称对应的值，建议使用的es6函数，不要使用普通js函数，* */
export type ToViteUserConfigs = {
  [Key in keyof NoPluginsFiledUserConfig]+?:
  {
    [key: string | number | symbol]:
      Function
      | ((options: ViteRunHandleFunctionOptions) => DeepPartial<NoPluginsFiledUserConfig[Key]>)
      | DeepPartial<NoPluginsFiledUserConfig[Key]>
  }
}

/** vite-run用于baseConfig， configs.[xxx].config 时当传入是函数时交付给该函数的参数选项 */
export type ViteRunHandleFunctionOptions = {
  name: string | undefined;
  pathName: string;
  packagePath: string
  type: string
}

/** 提取所有非Record类型 */
export type ExtractNonObject<T> = Exclude<T, Record<any, any>>
/** 提取所有Record类型 */
export type ExtractObject<T> = Extract<T, Record<any, any>>

/** 深度递归忽略对象的所有属性值为可选 */
export type DeepPartial<T> = {
  [K in keyof T]?:
  ExtractObject<T[K]> extends never
    ? T[K] /* 如果找不到object直接返回 */
    : T[K] extends ExtractObject<T[K]>
      ? T[K]   /* 看下是否是无限嵌套，如果是直接返回不再Partial，否则继续深度Partial */
      : (DeepPartial<ExtractObject<T[K]>> | ExtractNonObject<T[K]>)  /* 剩下就是Record继续DeepPartial，然后联合上之前所有的非Record */
  // : ExtractAnyTypeObject<T[K]> extends Array<any> ? T[K] /* Array 也是 Record， 但是无需忽略也直接返回 */
  // : DeepPartial<ExtractObject<T[K]>> | ExtractNonObject<T[K]>
}


export type configItemType = {
  viteName: string
  value: any
}

export type TargetMapInfo = Record<string, {
  require: boolean,
  apps: Array<{ appName: string, group: any[], type: 'server |dev | build | preview', config: object }>
}>
