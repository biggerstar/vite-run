export type supportViteMethod = 'build' | 'server' | 'preview'

export type LOG_VITE_SET_TYPE = {
  /** vite日志： 是否显示vite默认build模式下的 build started...日志 */
  buildStart?: boolean
  /** vite日志： 是否显示vite默认build模式下的building for production 日志 */
  buildFor?: boolean
  /** vite日志： 是否显示vite默认build模式下的 built in xxx ms 日志 */
  builtIn?: boolean
  /** vite日志： 是否显示vite默认build模式下的  xx.xx kB │ gzip: xx.xx kB 日志 */
  sizeAntOutputPrint?: boolean
  /** vite日志： 是否显示vite默认build模式下的 build.watch 打开情况下的  watching for file changes  */
  watchingForFileChanges?: boolean
  /** vite日志： 是否显示vite默认build模式下的 xxx modules transformed.  */
  transformed?: boolean
  /** vite日志： 是否显示vite默认server模式下的  模式下的transforming (x) 日志 */
  transforming?: boolean
  /** vite日志： 是否显示vite默认server模式下的  computing gzip size 日志*/
  computingGzipSize?: boolean
  /** vite日志： 是否显示vite默认server模式下的  page reload XXX.xx 等修改文件热重载的 日志*/
  pageReload?: boolean

}
export type LOG_VITE_RUN_SET_TYPE = {
  /** 插件日志： 是否显示包名相关信息，例如 package name:  appPackage for config umd*/
  packageName?: boolean
  /** 插件日志： 是否显示入口信息，例如 /Users/computer/Desktop/project/packages/app/src/index.ts */
  input?: boolean
  /** 插件日志： 是否显示构建产物输出信息，例如 /Users/computer/Desktop/project/packages/dist/index.[xxx] */
  output?: boolean
  /** 插件日志： 是否显示不同产物之间的分割线,例如 ---------------------------------------------------- */
  splitLine?: boolean
}

export type LogSettingMap = Record<keyof OutputLogFinallyOptions, Partial<OutPutLogItemFinallySetting>>

export type OutPutLogItemSetting = {
  viteLog?: boolean | LOG_VITE_SET_TYPE
  viteRunLog?: boolean | LOG_VITE_RUN_SET_TYPE
}

export type OutputLogOptions = {
  /** 用户自定义的拦截关键字的字段，支持正则 */
  rules?: Array<MatchRule>
  /** 编译时应用的日志配置 */
  build?: OutPutLogItemSetting
  /** lib是在build模式下开启watch时应用的配置
   * [!请注意]  开启了watch会自动切换到该模式  */
  lib?: OutPutLogItemSetting
  /** 启动vite服务器时应用的日志配置 */
  server?: OutPutLogItemSetting
  /** 启动vite预览服务器时应用的日志配置 */
  preview?: OutPutLogItemSetting
}

export type OutPutLogItemFinallySetting = {
  [key: string]: any
  VITE: LOG_VITE_SET_TYPE
  VITE_RUN: LOG_VITE_RUN_SET_TYPE
}

export type OutputLogFinallyOptions = {
  [key: string]: any
  /** 是否拦截原来的vite日志 */
  build: OutPutLogItemFinallySetting
  lib: OutPutLogItemFinallySetting
  server: OutPutLogItemFinallySetting
  preview: OutPutLogItemFinallySetting
}


export type ConsolePrintController = {
  blockFirstConsolePrint: null | boolean,
  /** 指定阻塞时间 */
  blockTime(time: number): void,
  /** 是否阻塞中 */
  isBlock(): boolean,
  /** 是否第一次阻塞，也就是之前没阻塞过  */
  isFirst(): boolean,
  /** 阻塞  */
  block(): void,
  /** 释放  */
  release(): void
}
export type MatchRule = { match: string | RegExp, rule?: Function }
