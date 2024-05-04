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
import colors from "picocolors";


const templateMapping = {
  default: targetTemplateConfigName,
  docs: targetTemplateDocsConfigName
}

/** 创建 viterun.config 配置模板 */
export function copyViteRunConfig(argMap: Record<any, any>) {
  // console.log(argMap);
  const __filename = import.meta.url
  const urls = new URL(__filename)
  const filePath = urls.pathname
  const res = glob.globSync(`${cwd()}/src/**/*.{ts,tsx}`) // 如果项目中有 ts 文件表明这是一个 ts 项目， 此时生成 ts 配置
  let suffix = res.length > 0 ? '.ts' : '.js'
  const configFileName = `${targetConfigName}${suffix}`
  let templateName: keyof typeof templateMapping = 'default'
  if (argMap.docs) templateName = 'docs'
  const configPath = resolve(filePath, `../../${templateMapping[templateName]}`)
  let toPath = resolve(cwd(), `./${configFileName}`)
  if (argMap['shadow']) toPath = toPath + '.ts'   // 如果是调试情况下，为输出文件多加上一个后缀防止覆盖先工程的文件
  if (!existsSync(toPath)){ // 如果文件不存在则复制
    copyFileSync(configPath, toPath)
    console.log(colors.green('Successfully initialized viterun.config configuration file'))
  }
  else {
    if (argMap.cover) {
      copyFileSync(configPath, toPath)
      console.log(colors.green('Successfully overwritten the original viterun.config configuration file'))
    }
    else printErrorLog(` The '${configFileName}' file already exists in the root directory`)
  }
}
