// 只手动测试dts是否报错，嫌麻烦懒得使用vitest或者jest

import {defineConfig} from "../src";

function getBaseConfig() {
  return {}
}


const config = defineConfig({
  baseConfig: getBaseConfig,
  packages: [
    'packages/*',
    'examples/base/*',
    'examples/apps/native',
    'examples/apps/vue3',
  ],
  targets: {
    'vite-run': {
      build: [
        ['es', 'types'],
        'umd'
      ],
      types: ['types'],
    },
  },
  plugins: {
    plugin: [
      {
        name: 'test'
      }
    ]
  },
  build: {
    types: {
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    },
    es: {
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    },
    umd() {
      return {
        lib: {
          formats: ['es', 'iife']
        },
        rollupOptions: {
          output: {
            format: "umd"
          }
        }
      }
    }
  }
})

