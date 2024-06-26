import process from "node:process";
import {ViteRunOptions} from "@/types";
import {loadConfig} from "unconfig";
import colors from "picocolors";

export const issueUrl = 'https://www.github.com/biggerstar/vite-run/issue'
export const consolePrintConfigHeader = '[viterun.config]'
export let consolePrintHeader = '[viterun] '
export const targetConfigName = 'viterun.config'
export const targetTemplateConfigName = 'default-viterun.config.ts'
export const targetTemplateDocsConfigName = 'docs-viterun.config.ts'

export const configSuffixList = ['ts', 'tsx', 'mts', 'js', 'mjs']
export const selfConfigFields = ['packages', 'baseConfig', 'targets']

/** 检查数组中重复的值并返回重复值的列表 */
export function findDuplicates(arr: Array<any>) {
  const map = new Map();
  const duplicates = [];
  for (const item of arr) {
    if (map.has(item)) {
      map.set(item, map.get(item) + 1);
    } else {
      map.set(item, 1);
    }
  }
  for (const [key, value] of map) {
    if (value > 1) {
      duplicates.push(key);
    }
  }
  return duplicates;
}

export const isFunction = (target: any): target is Function => typeof target === "function"
export const printSpaceLine = (lineNumber: number = 0) => console.log('\n'.repeat(lineNumber))

/** 打印日志，isExit= true的时候直接终止进程 */
export function printLog(log: string, isExit = false) {
  console.log(colors.cyan(consolePrintConfigHeader), colors.bold(colors.gray(':')), log)
  if (isExit) process.exit(-1)
}

export function printErrorLog(log: string, isProcessExit = false) {
  console.log(colors.red(consolePrintConfigHeader + ':' + log))
  if (isProcessExit) process.exit(-1)
}

export function printIssueLog(log: string, isExit = false) {
  console.log(colors.red(consolePrintConfigHeader + log + ':  This is an unexpected bug, please report it to the developer'), issueUrl)
  if (isExit) process.exit(-1)
}

let localConfig: Partial<ViteRunOptions>
/*
  在 vite4 以上 vite 已经弃用 cjs 加载，
  而本库使用 unconfig 加载 viterun.config 文件， unconfig库最终会编译成cjs
  这里拦截控制台输出将 vite 发出的 cjs 弃用警告忽略
*/
const realLog = console.log
console.warn = (...msgs) => {
  if (msgs.join('').includes('The CJS build of Vite\'s Node API is deprecated.')) {
    return
  }
  realLog(...msgs);
};

/** 读取本地 vite-run.config 配置 */
export async function readLocalViteRunConfig(): Promise<Partial<ViteRunOptions> | false> {
  if (localConfig) return localConfig   // 如果已经读过了，直接返回不会重新读取

  const {config} = await loadConfig({
    sources: [
      {
        files: targetConfigName,
        extensions: configSuffixList,
      },
    ],
    merge: false,
  })
  if (!config) {
    console.log(colors.red(`The ${targetConfigName} configuration file cannot be found, You can run 'vite run --init' to create a template`))
  }
  return localConfig = (config || {}) as Partial<ViteRunOptions<{}>>
}

export async function sleep(time: number = 0) {
  return new Promise(resolve => setTimeout(resolve, time))
}
