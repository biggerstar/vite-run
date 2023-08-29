import {Command} from 'commander'
import {version as packVersion} from "../../../package.json"
import colors from "picocolors";
import {ConfigManager} from "@/bin/vite-run/ConfigManager";
import {resolve} from "node:path";
import {cwd} from "node:process";
import {printErrorLog, targetConfigName, targetTemplateConfigName} from "@/bin/vite-run/common";
import {copyFileSync, existsSync} from 'node:fs'
import {glob} from "glob";

let configManager: ConfigManager

async function execViteTarget(args) {
  const scriptType = args.shift()   // 运行target某个规则类型先拿出来，后面剩下的都会是包名
  // args 如果数组不等于0个，说明针对指定一个或多个包执行 scriptType定义的配置
  await configManager.patch(scriptType, args)
}

function copyViteRunConfig(argMap) {
  if (argMap.init) {
    const __filename = import.meta.url
    const urls = new URL(__filename)
    const filePath = urls.pathname
    const res = glob.globSync(`${cwd()}/src/**/*.{ts,tsx}`)
    const suffix = res.length > 0 ? '.ts' : '.js'
    const configFileName = `${targetConfigName}${suffix}`
    const configPath = resolve(filePath, `../../${targetTemplateConfigName}`)
    const toPath = resolve(cwd(), `./${configFileName}`)
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
    .description(colors.green('\u25B6  ' + 'Used to define multiple different vite packaging configurations for all subpackages and manage them uniformly' + ' \u25C0'))
    .version(packVersion)
    /* @ts-ignore */
    .action(async (argMap: any, options: any) => {
      const args = options.args || []
      if (args.length < 1 && Object.keys(argMap).length === 0) return program.help()
      //-----------------------------------------------------
      if (args.length) await execViteTarget(args)
      if (Object.keys(argMap)) copyViteRunConfig(argMap)
    })

  program.parse();
})()
