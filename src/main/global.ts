/** 该工具使用常见注意事项： 1.在子包的根目录不建议重复定义vite.config配置文件，因为这很可能会带来不必要的错误
 *                         所以建议所有要管理的子包配置都写在顶层目录下的viterun.config中
 *                       2. 该工具内置了一个名为 viteRunLogPlugin 的控制台日志输出管理插件, 该插件可以高度定制vite和viteRun在控制台的输出内容
 *                          可以通过 import {viteRunLogPlugin} from 'vite-run '导入使用
 *                       3. 您如果有额外的执行shell脚本的需求，您可以在vite插件的不同周期内执行，例如使用shelljs库在打包结束后输出 success
 *                          那么您可以这样做，创建一个vite插件
 *                          {
 *                            name:'print-success',
 *                            buildEnd(){
 *                              shelljs.exec('success')
 *                            }
 *                          }
 *                       4.如果想获取vite的最终config，可以通过vite插件中的 configResolved 钩子获得
 *                       5.配置名字段如果使用函数的话,建议写成键值对形式，这样能够更好的获得类型提示。例如写成 { test:()=>{} } 而不是 { test(){} }
 * */
import {ViteRunOptions} from "@/types";

export function defineViteRunConfig<OptionsData extends ViteRunOptions<OptionsData>>(options: OptionsData)
  : ViteRunOptions<OptionsData> {
  // defineConfig不会对传入对象配置进行任何操作，目的只是为了外部使用者获得完整的类型提示
  return options
}

