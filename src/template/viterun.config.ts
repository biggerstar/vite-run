import {resolve} from "node:path";
import {defineViteRunConfig, viteRunLogPlugin} from "vite-run";


export default defineViteRunConfig({
  /*
   * baseConfig A function that accepts an object or returns a vite configuration object,
   * This function generally only contains information that is common to all configurations,
   * and is not a complete vite configuration
   *
   * All app configurations are merged with baseConfig as the final vite configuration.
   * For example, the following lib.build contains two configurations ['es'] and ['build_lib','umd']
   * the merge rule is:
   *                  viteConfig1 = es + baseConfig
   *                  viteConfig2 = build_lib + umd + baseConfig
   */
  baseConfig: getBaseConfig,

  // Specify the app name to manage, The app name is the folder name,A package is also called an app
  packages: [
    // Manage all apps in a folder
    'packages/*',
    // Explicitly specify app to manage
    'examples/web1',
    // './' will manage the main app, which is named the current project name
    './'
  ],

  // Configure the vite configuration block information to be executed for the currently managed app
  targets: {
    /* syntax:
        appName(or say packageName) :{
          configurationName: [
            configuration block1,
            [configuration block1,configuration block2,....],
            [configuration block1,configuration block3,....],
          ]
        }
        Final vite configuration =  merge(configuration group) + baseConfig
    */

    /* Here lib1 is the app name, which must be the directory specified in packages   */
    'lib1': {
      build: [
        /* The es configuration here will be combined with baseConfig for the final vite configuration
         * The es configuration here points to the object that is the build.es configuration below
         */
        // You can also write it as a single string, but then only es can merge with baseConfig
        // 'es',
        ['es'],

        /*
        * The build_lib and umd configurations here will be combined with baseConfig for the final vite configuration
        * build_lib and umd are merged from left to right, with later values overwriting previous values if there is a deep merge conflict
        * For example configuration block:
        *  block1 = {
            a1:1,
            b1:2,
            c1:{
               d1:3,
               e1:4
             }
           }
           block2 = {
              b1:100,
              c1:{
                d1:200
              }
           }

          block1 + block2 === {
            a1:1,
            b1:100,
            c1:{
               d1:200,
               e1:4
             }
           }
         The implementation here is the generic deepmerge approach
        */
        ['plugin1', 'umd']
      ],
      types: ['types'],
      dev: ['watch']
    },
    'web1': {
      build: [
        ['es'],
        ['umd', 'minify']
      ],
      dev: ['10000']
    },
  },

  /*
  * syntax:
  * viteOriginalField:{
  *   configurationBlockName:configurationBlock
  * }
  * configurationBlock is the original configuration of vite
  *
  * The Vite-run tool simply names the original configuration by wrapping it around
  * it so that it can be freely combined with the block names
  * to increase the flexibility of building the final configuration of vite
  *
  * notice:
  *       Not only does build support this configuration block mode,
  *       but all vite built-in configuration keywords can be used to generate
  *       and name configuration blocks in this way
  * */
  build: {
    umd: {
      lib: {
        formats: ['umd']
      }
    },
    es: {
      lib: {
        formats: ['es']
      },
    },
    watch: {
      watch: {},
    },
    minify: {
      minify: true
    },

    /*
     * The configuration block supports receiving a function
     * so that you can more flexibly generate the content of the configuration block
     *
     * notice:
     *     If you want to get better ts type hints, you should use the arrow function
     */
    build_lib: (options) => {
      return {
        lib: {
          entry: resolve(options.packagePath, 'main.ts'),
          formats: ['umd'],
          name: options.name,
          fileName: (format) => `index.${format}.js`,
        },
        watch: {},
        rollupOptions: {
          watch: {},
          external: [],
          output: {}
        },
      }
    },
  },
  server: {
    10000: {
      // open: true,
      port: 10000
    },
  },
  preview: {
    '20000': {
      port: 20000,
    }
  },
  plugins: {
    plugin1: (_) => {
      return [
        {
          name: 'example-plugin1',
          apply: 'build',
          resolveId(_) {
          },
        },
      ]
    },
    plugin2: [
      {
        name: 'example-plugin2',
        resolveId(_) {
        },
      },
    ]
  }
})

function getBaseConfig(options) {
  return {
    resolve: {
      extensions: [".ts", ".js", '.css'],
      alias: {
        "@": resolve(options.packagePath, 'src'),
        types: resolve(options.packagePath, 'src/types')
      }
    },
    build: {
      emptyOutDir: false,
      minify: false,
      rollupOptions: {
        output: {
          sourcemap: false,
          globals: {}
        },
        treeshake: true
      },
    },
    plugins: [
      viteRunLogPlugin({
        // Intercept and output console logs
        // server: {
        //     viteLog: true,
        //     viteRunLog: {
        //        sizeAntOutputPrint:false
        //     }
        // }
      }),
    ]
  }
}
