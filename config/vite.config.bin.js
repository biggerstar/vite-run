import {defineConfig} from 'vite';
import {resolve} from "node:path";
import {createRequire} from 'node:module'
import {cwd} from "node:process";
import copy from "rollup-plugin-copy";
import {targetTemplateConfigName, targetTemplateDocsConfigName} from "../src/bin/vite-run/common.js";

const requireCjs = createRequire(import.meta.url)
const {name: moduleName} = requireCjs('../package.json')
const __dirname = cwd()

export default defineConfig({
  root: __dirname,
  resolve: {
    extensions: [".ts", ".js", ".d.ts"],
    alias: {
      "@": resolve(__dirname, 'src'),
    }
  },
  plugins: [
    copy({
      targets: [
        {src: `src/template/${targetTemplateConfigName}`, dest: 'dist'},
        {src: `src/template/${targetTemplateDocsConfigName}`, dest: 'dist'},
      ]
    }),
  ],
  build: {
    emptyOutDir: false,
    outDir: 'dist',
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/bin', `${moduleName}`, `${moduleName}`),
      name: moduleName,
      formats: ['es'],
      fileName: ( ) => `bin/${moduleName}.js`
    },
    rollupOptions: {
      external: [
        'node:module',
        'node:process',
        'node:path',
        'node:fs',
        'node:url',
        'commander',
        'inquirer',
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

