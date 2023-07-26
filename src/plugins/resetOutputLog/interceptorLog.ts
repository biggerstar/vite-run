import {isVitePrint} from "./common";
import {MatchRule} from "./types";
import process from "node:process";

/** match 是匹配字符串，支持正则 ， rule是一个函数，只有且仅为函数时返回true会被拦截 */
export function createInterceptorRules(LogConfig: any): Array<MatchRule> {
  return [
    {
      match: 'build started',
      rule: () => isVitePrint(LogConfig, 'buildStart'),
    },
    {
      match: 'building for',
      rule: () => isVitePrint(LogConfig, 'buildFor'),
    },
    {
      match: 'built in',
      rule: () => isVitePrint(LogConfig, 'builtIn'),
    },
    {
      match: 'gzip: ',
      rule: () => isVitePrint(LogConfig, 'sizeAntOutputPrint'),
    },
    {
      match: 'modules transformed.',
      rule: () => isVitePrint(LogConfig, 'transformed'),
    },
    {
      match: 'page reload ',
      rule: () => isVitePrint(LogConfig, 'pageReload'),
    },
    {
      match: 'watching for file changes',
      rule: () => isVitePrint(LogConfig, 'watchingForFileChanges'),
    }, {
      match: 'transforming',
      rule: () => isVitePrint(LogConfig, 'transforming'),
    }, {
      match: 'computing gzip size',
      rule: () => isVitePrint(LogConfig, 'computingGzipSize'),
    },
  ]
}


export function createInterceptorLog(LogConfig: any) {
  const rules: Array<MatchRule> = createInterceptorRules(LogConfig)
  return {
    isInterceptor(log: string) {
      for (let i in rules) {
        const item = rules[i]
        const {match, rule} = item
        let patten = match
        if (!(match instanceof RegExp)) patten = new RegExp(match)
        if ((patten as RegExp).test(log)) {
          if (typeof rule === "function") return !rule(log)
          return true
        }
      }
      return false
    },
    addRule(rule: MatchRule) {
      if (rule && typeof rule === "object" && typeof rule.match === 'string') rules.push(rule)
    },
    removeRule(rule: MatchRule) {
      for (const i in rules) {
        if (rules[i].match.toString() === rule.match.toString()) {
          rules.splice(Number(i), 1)
        }
      }
    }
  }
}

/** 拦截或限制指定日志输出, 是导出外部的函数，外部可以通过传入函数额外自定义拦截规则*/
const rowStdoutWrite = process.stdout.write

export function interceptStdoutWriteLog(call: Function) {
  //@ts-ignore    拦截标准输入输出
  process.stdout.write = function (log: Uint8Array | string, encoding?: any, cb?: (err?: Error) => void) {
    if (typeof log === 'string') {
      if (typeof call === 'function' && call(log)) return;
    }
    process.nextTick(() => rowStdoutWrite.call(process.stdout, log, encoding, cb))
  }
}
