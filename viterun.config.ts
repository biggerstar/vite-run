import {resolve} from "node:path";
import {BaseConfigReturnType, defineViteRunConfig, ViteRunHandleFunctionOptions, viteRunLogPlugin} from "./src";
import createCopyDts from "vite-plugin-copy-dts";
import dts from "vite-plugin-dts";

export default defineViteRunConfig({
  baseConfig: getBaseConfig,
  packages: [
    'packages/*',
    'examples/*',
    // './'
  ],
  /* 支持对象和函数 */
  targets: () => {
    return {
      // 'vite-run': {   // 支持操作主包,名称为根目录文件夹名称
      //   dev: ['watch']
      // },
      'lib1': {
        build: [
          ['build_lib', 'umd', 'minify']
        ],
        types: [
          ['types']
        ],
        '@dev': [
          ['watch']
        ],
      },
      'lib2': {
        '@build': [
          ['es'],
          ['umd', 'minify']
        ],
        types: [
          ['types']
        ],
        dev: [
          ['watch']
        ]
      },
      'web1': {
        build: [
          ['es', 'production'],
          ['umd', 'minify']
        ],
        dev: [
          ['s10000']
        ],
        preview: [
          ['p20000']
        ]
      },
      'web2': {
        build: [
          ['es'],
          ['umd', 'minify']
        ],
        dev: [
          ['s11000']
        ]
      },
    }
  },
  mode: {
    production: 'production',
    development: 'development',
  },
  build: {
    es() {
      return {
        lib: {
          formats: ['es']
        }
      }
    },
    umd: {
      lib: {
        formats: ['umd']
      },
    },
    watch: {
      watch: {},
    },
    minify: {
      minify: true
    },
    build_lib: (options) => {
      return {
        lib: {
          entry: resolve(options.packagePath, 'src', 'index.ts'),
          formats: ['umd'],
          name: options.name,
          fileName: (format: string) => `index.${format}.js`,
        },
        rollupOptions: {
          external: [
            'vite',
            'vue',
            'vue-router',
          ],
          output: {
            exports: 'named',
            globals: {
              vue: 'Vue'
            },
          }
        },
      }
    },

  },
  server: {
    s10000: {
      // open: true,
      port: 10000
    },
    s11000: {
      port: 11000
    },
    s12000: {
      port: 12000
    },
  },
  preview: {
    p20000: {
      port: 20000,
    }
  },
  plugins: {
    types: (options) => {
      return [
        createCopyDts({
          // logLevel:'info',
          root: options.packagePath,
          files: [
            {
              from: ['types/*.d.ts'],
              to: `dist/${options.name}.d.ts`,
              excludes: ['types/index.d.ts']
            }
          ]
        }),
        dts({
          rollupTypes: true,
          copyDtsFiles: true,
          // logLevel: 'silent',
        }),
        {
          name: 'block-js-file-output',
          apply: 'build',
          generateBundle(_: any, bundle: any) {
            for (const k in bundle) {
              delete bundle[k]   // 禁止该js后面产物的输出文件，目的为了只输出dts
            }
          },
        },
      ]
    }
  }
})

function getBaseConfig(options: ViteRunHandleFunctionOptions): BaseConfigReturnType {
  // console.log(this);
  // console.log('viterun:', options)
  const entryPath = options.packagePath.includes('examples/')
    ? resolve(options.packagePath, `index.html`)
    : resolve(options.packagePath, 'src', `index.ts`)

  return {
    resolve: {
      extensions: [".ts", ".js", ".d.ts", '.vue', '.css'],
      alias: {
        "@": resolve(options.packagePath, 'src'),
        types: resolve(options.packagePath, 'src/types')
      }
    },
    build: {
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: entryPath,
        name: options.name,
        fileName: (format: any) => `${options.name}.${format}.js`,
      },
      rollupOptions: {
        external: [
          "vite",
          "picocolors",
          "node:process",
          "node:path",
          "node:process",
        ],
        output: {
          sourcemap: false,
          globals: {}
        },
        treeshake: true
      },
    },
    server: {
      hmr: true,
      cors: true,
      strictPort: true,
      port: 6000
    },
    plugins: [
      viteRunLogPlugin({
        // server: {
        //     viteLog: true,
        //     viteRunLog: {}
        // }
      }),
    ]
  }
}
