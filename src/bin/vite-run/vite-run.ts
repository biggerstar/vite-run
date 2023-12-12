import {Command} from 'commander'
import {version as packVersion} from "../../../package.json"
import colors from "picocolors";
import {ConfigManager} from "@/bin/vite-run/ConfigManager";
import {resolve} from "node:path";
import {cwd} from "node:process";
import {
  printErrorLog,
  targetConfigName,
  targetTemplateConfigName,
  targetTemplateDocsConfigName
} from "@/bin/vite-run/common";
import {copyFileSync, existsSync} from 'node:fs'
import {glob} from "glob";

let configManager: ConfigManager

async function execViteTarget(args) {
  const scriptType = args.shift()   // 运行target某个规则类型先拿出来，后面剩下的都会是包名
  // args 如果数组不等于0个，说明针对指定一个或多个包执行 scriptType定义的配置
  await configManager.patch(scriptType, args)
}

const templateMapping = {
  p: targetTemplateConfigName,
  docs: targetTemplateDocsConfigName
}

/** 创建 viterun.config 配置模板 */
function copyViteRunConfig(argMap) {
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
      else printErrorLog(` The ${configFileName} file already exists in the root directory`)
    }
  }
}

(async () => {
  const program = new Command();
  configManager = new ConfigManager()
  await configManager.init()

  program
    .name('vite-run')
    .option('--init', 'Initialize Configuration Template')
    .option('-f', 'Force overwrite of local viterun.config file during initialization')
    .option('-p', 'Generate the vite-run configuration without comments')
    .option('--shadow', '')  // 生成影子文件，用于调试产出文件不会覆盖原有的viterun.config
    .description(colors.green('\u25B6  ' + 'Used to define multiple different vite packaging configurations for all subpackages and manage them uniformly' + ' \u25C0'))
    .version(packVersion)
    /* @ts-ignore */
    .action(async (argMap: any, options: any) => {
      const args = options.args || []
      if (args.length < 1 && Object.keys(argMap).length === 0) return program.help()
      if (Object.keys(argMap)) copyViteRunConfig(argMap)
      //-----------------------------------------------------
      if (args.length) await execViteTarget(args)
    })

  program.parse();
})()
