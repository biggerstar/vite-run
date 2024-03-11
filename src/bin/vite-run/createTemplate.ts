import {glob} from "glob";
import {cwd} from "node:process";
import {
  printErrorLog,
  targetConfigName,
  targetTemplateConfigName,
  targetTemplateDocsConfigName
} from "@/bin/vite-run/common";
import {resolve} from "node:path";
import {copyFileSync, existsSync} from "node:fs";


const templateMapping: Record<string, any> = {
  p: targetTemplateConfigName,
  docs: targetTemplateDocsConfigName
}

/** 创建 viterun.config 配置模板 */
export function copyViteRunConfig(argMap: Record<string, any>) {
  // console.log(argMap);
  if (argMap.init) {
    const __filename = import.meta.url
    const urls = new URL(__filename)
    const filePath = urls.pathname
    const res = glob.globSync(`${cwd()}/src/**/*.{ts,tsx}`)
    let suffix = res.length > 0 ? '.ts' : '.js'
    const configFileName = `${targetConfigName}${suffix}`
    let templateName = 'docs'
    if (argMap.p) templateName = 'p'
    const configPath = resolve(filePath, `../../${templateMapping[templateName]}`)
    let toPath = resolve(cwd(), `./${configFileName}`)
    if (argMap['shadow']) toPath = toPath + '.ts'   // 如果是调试情况下，为输出文件多加上一个后缀防止覆盖先工程的文件
    if (!existsSync(toPath)) copyFileSync(configPath, toPath) // 如果文件不存在则复制
    else {
      if (argMap.f) copyFileSync(configPath, toPath)
      else printErrorLog(` The '${configFileName}' file already exists in the root directory`)
    }
  }
}
