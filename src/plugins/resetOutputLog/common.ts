import {
  ConsolePrintController,
  LOG_VITE_RUN_SET_TYPE,
  LOG_VITE_SET_TYPE,
  LogSettingMap,
  OutputLogFinallyOptions,
  OutPutLogItemFinallySetting,
  OutPutLogItemSetting,
  OutputLogOptions
} from "./types";
import {LOG_SETTING_MAP, VITE_COMMON, VITE_RUN_COMMON} from "./defaultLogMap";
import {Plugin} from "vite";
import process from "node:process";

export function createLogSettingMap(map: LogSettingMap) {
  for (const k in map) {
    const owmDefaultConfig = map[k]
    map[k] = {
      VITE: {
        ...VITE_COMMON,
        ...owmDefaultConfig['VITE']
      },
      VITE_RUN: {
        ...VITE_RUN_COMMON,
        ...owmDefaultConfig['VITE_RUN']
      }
    }
  }
  return map
}

export function initLogItemSetting(viteRunType: keyof OutputLogFinallyOptions, item: OutPutLogItemSetting | undefined): OutPutLogItemFinallySetting {
  LOG_SETTING_MAP.init()
  const viteLog = item?.viteLog
  const viteRunLog = item?.viteRunLog
  let VITE = <LOG_VITE_SET_TYPE>{...LOG_SETTING_MAP.data[viteRunType]['VITE']}
  let VITE_RUN = <LOG_VITE_RUN_SET_TYPE>{...LOG_SETTING_MAP.data[viteRunType]["VITE_RUN"]}
  if (typeof item?.viteLog === 'boolean') setAllSameValue(VITE, viteLog)
  else Object.assign(VITE, viteLog || {})

  if (typeof item?.viteRunLog === 'boolean') setAllSameValue(VITE_RUN, viteRunLog)
  else Object.assign(VITE_RUN, viteRunLog || {})
  return {
    VITE,
    VITE_RUN
  }
}

export function setAllSameValue(target: Record<any, any>, value: any) {
  for (const k in target) {
    target[k] = value
  }
}

export function getViteRunTypeLogConfig(viteRunType: keyof OutputLogFinallyOptions, options: OutputLogOptions & Record<any, any>): OutPutLogItemFinallySetting {
  return initLogItemSetting(viteRunType, options[viteRunType])
}

export function isViteRunPrint(LogConfig: OutPutLogItemFinallySetting, key: keyof LOG_VITE_RUN_SET_TYPE): boolean {
  return !!LogConfig?.["VITE_RUN"]?.[key]
}

export function isVitePrint(LogConfig: OutPutLogItemFinallySetting, key: keyof LOG_VITE_SET_TYPE): boolean {
  return !!LogConfig?.["VITE"]?.[key]
}

export function getVitePlugin(plugins: any[] = [], key: string): Partial<Plugin> {
  return plugins.find((plugin: any) => plugin.name === key) || {}
}

export function createConsolePrintController(): ConsolePrintController {
  return {
    blockFirstConsolePrint: null,
    blockTime(time: number = 200) {
      setTimeout(() => this.release(), time) // 2 秒后释放阻塞
    },
    isBlock() {
      return this.blockFirstConsolePrint === true
    },
    isFirst() {
      return this.blockFirstConsolePrint === null
    },
    block() {
      this.blockFirstConsolePrint = true
    },
    release() {
      this.blockFirstConsolePrint = false
    }
  }
}
