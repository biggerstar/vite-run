import {LOG_VITE_RUN_SET_TYPE, LOG_VITE_SET_TYPE, LogSettingMap} from "./types";
import {createLogSettingMap} from "./common";

export const VITE_COMMON: LOG_VITE_SET_TYPE = {  // 默认VITE拦截配置,全部删除其实也不影响
  sizeAntOutputPrint: false,
  pageReload: false,
  buildStart: false,
  buildFor: false,
  builtIn: false,
  transformed: false,
  transforming: false,
  computingGzipSize: false,
  watchingForFileChanges: false,
}
export const VITE_RUN_COMMON: LOG_VITE_RUN_SET_TYPE = { // 默认VITE_RUN注入配置,全部删除其实也不影响
  packageName: false,
  input: false,
  output: false,
  splitLine: false,
}


export const LOG_SETTING_MAP_DEFINE: LogSettingMap = {
  build: {
    VITE: {
      sizeAntOutputPrint: true,
    },
    VITE_RUN: {
      packageName: true,
      input: true,
      output: true,
      splitLine: true,
    }
  },
  lib: {
    VITE: {
      sizeAntOutputPrint: false,
    },
    VITE_RUN: {
      packageName: true,
    }
  },
  server: {
    VITE: {
      pageReload: true,
    },
    VITE_RUN: {
      packageName: true,
    }
  },
  preview: {
    VITE: {
    },
    VITE_RUN: {
      packageName: true,
    }
  },
}

export let LOG_SETTING_MAP = {
  __initialized__: false,
  data: {},
  init(): void {
    if (this.__initialized__) return
    this.data = createLogSettingMap(LOG_SETTING_MAP_DEFINE)
    this.__initialized__ = true
  }
} as {
  __initialized__: boolean,
  data: LogSettingMap,
  init: Function
}
