import {build, createServer, preview} from "vite";
import {printLog, printSpaceLine, sleep} from "@/bin/vite-run/common";
import colors from "picocolors";
import {supportViteMethod} from "@/plugins/resetOutputLog/types";

export async function patchToViteEngine(type: supportViteMethod, viteConfig: any) {
  async function runPreview() {
    const previewServer = await preview(viteConfig)
    printSpaceLine()
    previewServer.printUrls()
  }

  async function runServe() {
    const server = await createServer(viteConfig)
    await server.listen()
    printSpaceLine()
    server.printUrls()
  }

  async function runBuild() {
    await build(viteConfig)
  }

  switch (type) {
    case 'preview': {
      await runPreview()
    }
      break
    case 'server': {
      await sleep(100)  // 必须，为了日志错开
      await runServe()
    }
      break
    case 'build': {
      await runBuild()
    }
      break
    default : {
      printLog(colors.red(`[patchToViteEngine]${type}not supported`,), true)
    }
  }
}
