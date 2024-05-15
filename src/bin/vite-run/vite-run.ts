import {Command} from 'commander'
import {version as packVersion} from "../../../package.json"
import colors from "picocolors";
import {ConfigManager} from "@/bin/vite-run/ConfigManager";
import {copyViteRunConfig} from "@/bin/vite-run/createTemplate";

let configManager: ConfigManager

async function execViteTarget(args: string[], optionValues: Record<string, any>) {
  const scriptType = args.shift()   // 运行target某个规则类型先拿出来，后面剩下的都会是包名
  // args 如果数组不等于0个，说明针对指定一个或多个包执行 scriptType定义的配置
  if (scriptType) await configManager.patch(scriptType, args, optionValues)
}


(async () => {
  const program = new Command();
  configManager = new ConfigManager()

  program
    .name('vite-run')
    .option('-y', 'Do not pop up the option to run the module, run all directly')
    .description(colors.green('\u25B6  ' + 'Used to define multiple different vite packaging configurations for all subpackages and manage them uniformly' + ' \u25C0'))
    .version(packVersion)
    .action(async (argMap: any, options: Record<any, any>) => {
      const args = options.args || []
      if (args.length === 0 && Object.keys(argMap).length === 0) {
        return program.help()
      }
      //-----------------------------------------------------
      await configManager.init()
      if (args.length) {
        await execViteTarget(args, argMap)
      }
    })

  program.command('init')
    .description('\u25B6  ' + 'Initialize Configuration Template')
    .option('--cover', '[--init] Force overwrite of local viterun.config file during initialization')
    .option('--docs', '[--init] Generate the vite-run configuration without comments')
    .option('--shadow', '')  // 生成影子文件，用于调试产出文件不会覆盖原有的viterun.config
    .action(async (argMap: any, _: Record<any, any>) => {
      copyViteRunConfig(argMap)
    })

  program.parse();
})()
