// 只手动测试dts是否报错，嫌麻烦懒得使用vitest测试

import {defineViteRunConfig} from "../src";

function getBaseConfig() {
  return {}
}


defineViteRunConfig({
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
        ['umd']
      ],
      types: [['types']],
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
    },
    umd1: () => {
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

defineViteRunConfig(() => {
  return {
    packages: {},
    build: {
      test: {
        rollupOptions: {}
      }
    }
  }
})
