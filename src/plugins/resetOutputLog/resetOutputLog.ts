// noinspection JSUnusedGlobalSymbols

import colors from "picocolors";
import {basename, resolve} from "node:path";
import process from "node:process";
import {Plugin} from "vite";
import {OutputLogFinallyOptions, OutPutLogItemFinallySetting, OutputLogOptions} from "./types";
import {createConsolePrintController, getViteRunTypeLogConfig, isViteRunPrint} from "./common";
import {createInterceptorLog, interceptStdoutWriteLog} from "./interceptorLog";


export function viteRunLogPlugin(options?: OutputLogOptions): Plugin {
  if (!options) options = {}
  const matchRules = options.rules || []
  const libLogConfig = options.build
  let finallyConfig: any = {}
  let outputPath = ''
  let viteRunType: keyof OutputLogFinallyOptions = ''
  const controller = createConsolePrintController()
  let LogConfig: OutPutLogItemFinallySetting
  return {
    name: 'print-file-output',
    configResolved(config: any) {
      finallyConfig = config
      const buildConfig = finallyConfig.build
      const isWatch = buildConfig?.watch || buildConfig?.rollupOptions?.watch  // 是否是lib watch
      const viteRunConfig = config.viteRun || {}
      viteRunType = isWatch ? 'lib' : viteRunConfig['type']
      controller.blockTime(1000)
      //-----------------------------------------------------------------------
      // console.log(config);
      // console.log(viteRunConfig);
      //-----------------------------------------------------------------------
      LogConfig = getViteRunTypeLogConfig(viteRunType, <OutputLogOptions>options)
      const interceptorController = createInterceptorLog(LogConfig)
      matchRules.forEach(rule => interceptorController.addRule(rule))
      interceptStdoutWriteLog((log) => interceptorController.isInterceptor(log))
    },
    buildStart(arg: any) {
      if (controller.isBlock()) return
      const inputs = arg.input
      const root = finallyConfig.root || process.cwd()
      const {group} = (finallyConfig.viteRun || {})
      const formatLogString = group ? `\t--executed for configs ${group}` : ''
      const packageName = basename(root)
      if (isViteRunPrint(LogConfig, 'packageName')) {
        const buildConfig = finallyConfig.build
        // console.log(finallyConfig);
        const isWatch = buildConfig?.watch || buildConfig?.rollupOptions?.watch  // 是否是lib watch
        const watchString = isWatch ? '\t--watching changes' : ''
        console.log(colors.yellow('package name:'), colors.green(packageName), colors.gray(colors.bold(watchString)), colors.gray(formatLogString));
      }
      if (isViteRunPrint(LogConfig, 'input') && inputs) {
        console.log(colors.cyan('[input]  '), colors.green(inputs.join('\n\t')))
      }
    },
    writeBundle(arg: any) {
      outputPath = resolve(arg.dir)
    },
    configurePreviewServer(config: any) {
      const viteRun = config?.config?.viteRun || {}
      const {appName: packageName, group} = viteRun
      const formatLogString = group ? `\t--executed for configs ${group}` : ''
      console.log(colors.yellow('package name:'), colors.green(packageName), colors.gray(formatLogString));

    },
    closeBundle() {
      if (controller.isBlock()) return
      if (isViteRunPrint(LogConfig, 'output') && outputPath) {
        console.log(colors.cyan('[output] '), colors.gray(outputPath))
      }
      if (controller.isFirst() && viteRunType === 'lib') {
        // 如果是lib模式，刚开始编译会改变dist引发其他引用库发生变化，阻止其日志输出，比如A库引用了B库，改变了B库，B和A都会重编译
        // 该字段控制在vite声明周期内，前面执行输出多少钩子内的内容后截停,可以移动该行代码到任意钩子某个位置截停
        controller.block()
      }
      if (isViteRunPrint(LogConfig, 'splitLine')) {
        console.log(colors.gray('--'.repeat(30)))
      }
      return
    }
  }
}

