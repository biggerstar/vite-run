import {defineConfig} from 'vite';
import {resolve} from "node:path";
import {createRequire} from 'node:module'
import {cwd} from "node:process";

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
    build: {
        emptyOutDir: false,
        outDir: 'dist',
        minify: false,
        lib: {
            entry: resolve(__dirname, 'src/bin', `${moduleName}`, `${moduleName}`),
            name: moduleName,
            formats: ['es'],
            fileName: (format, filename) => `${'bin'}/${moduleName}.js`
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

