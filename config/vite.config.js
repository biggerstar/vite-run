import {defineConfig} from 'vite';
import {resolve} from "node:path";
import {cwd} from "node:process";
import dts from 'vite-plugin-dts'
import {createRequire} from 'node:module'
import createCopyDts from 'vite-plugin-copy-dts'

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
            entry: resolve(__dirname, 'src', `index.ts`),
            name: moduleName,
            formats: ['es', 'cjs'],
            fileName: (format, filename) => `${moduleName}.${format}.js`,
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

