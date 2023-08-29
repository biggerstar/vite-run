import {resolve} from "node:path";
import {defineViteRunConfig, viteRunLogPlugin} from "vite-run";

export default defineViteRunConfig({
  baseConfig: getBaseConfig,
  packages: [
    'packages/*',
    'examples/you-apps-folder',
    './'
  ],
  targets: {
    'you-app-name': {
      build: [
        ['es'],
        ['plugin1', 'umd']
      ],
      types: ['types'],
      dev: ['watch']
    },
    'you-app-name-1': {
      build: [
        ['es'],
        ['umd', 'minify']
      ],
      dev: ['10000']
    },
  },
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
