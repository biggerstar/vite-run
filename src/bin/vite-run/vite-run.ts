import {Command} from 'commander'
import {version as packVersion} from "../../../package.json"
import colors from "picocolors";
import {ConfigManager} from "@/bin/vite-run/ConfigManager";

let configManager: ConfigManager

(async () => {
  const program = new Command();
  configManager = new ConfigManager()
  await configManager.init()

  program
    .name('vite-run')
    .description(colors.green('\u25B6  ' + '用于定义所有子包多个不同的vite打包配置，并进行统一管理' + ' \u25C0'))
    .version(packVersion)
    /* @ts-ignore */
    .action(async (_: any, options: any) => {
      const args = options.args || []
      if (args.length < 1) return program.help()
      //-----------------------------------------------------
      const scriptType = args.shift()   // 运行target某个规则类型先拿出来，后面剩下的都会是包名
      // args 如果数组不等于0个，说明针对指定一个或多个包执行 scriptType定义的配置
      await configManager.patch(scriptType, args)
    })

  program.parse();
})()
