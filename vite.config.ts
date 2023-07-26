import {defineConfig, UserConfig} from 'vite';
import {resolve} from "path";
import dts from 'vite-plugin-dts'
import {createRequire} from 'node:module'
import createCopyDts from 'vite-plugin-copy-dts'

const requireCjs = createRequire(__filename)
const {name: moduleName} = requireCjs('./package.json')

export default defineConfig(<UserConfig>{
  root: __dirname,
  resolve: {
    extensions: [".ts", ".js", ".d.ts"],
    alias: {
      "@": resolve(__dirname, 'src'),
    }
  },
  plugins: [
    createCopyDts({
      files: [
        {
          from: 'types/*.d.ts',
          to: `dist/index.d.ts`
        }
      ]
    }),
    dts({
      rollupTypes: true,
      copyDtsFiles: true,
    })
  ],
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    minify: false,
    lib: {
      entry: [
        resolve(__dirname, 'src', `index.ts`),
        resolve(__dirname, 'src/bin', `${moduleName}`, `${moduleName}`),
      ],
      name: moduleName,
      formats: ['es'],
      fileName(_, filename) {
        if (filename === moduleName) return `${moduleName}.bin.js`
        return `${moduleName}.js`
      },
    },
    rollupOptions: {
      external: [
        'node:module',
        'node:process',
        'node:path',
        'node:fs',
        'node:url',
        'commander',
        'glob',
        'vite',
        'picocolors',
        'unconfig',
      ],
      output: {
        sourcemap: false,
      },
      treeshake: true
    },
  }
})
