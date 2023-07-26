// import basicSsl from '@vitejs/plugin-basic-ssl'
import {resolve} from "node:path";
import {BaseConfigReturnType, defineConfig, ViteRunHandleFunctionOptions, viteRunLogPlugin} from "vite-run";
import createCopyDts from "vite-plugin-copy-dts";
import dts from "vite-plugin-dts";


export default defineConfig({
    baseConfig: getBaseConfig,
    packages: [
        'packages/*',
        'examples/*',
        './'
    ],
    targets: {
        'vite-run': {   // 支持操作主包
            dev:['watch']
        },
        'lib1': {
            build: [['es', 'production'], 'umd'],
            types:['types'],
            dev:['watch']
        },
        'lib2': {
            build: ['es', 'umd'],
            types:['types'],
            dev:['watch']
        },
        'web1': {
            build: [['es', 'production'], 'umd'],
            dev:['10000']
        },
        'web2': {
            build: ['es', 'umd'],
            dev:['11000']
        },
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
            lib: {
                formats: ['es']
            }
        },
    },
    server: {
        10000: {
            // open: true,
            port: 10000
        },
        11000: {
            port: 11000
        },
        12000: {
            port: 12000
        },
    },
    preview: {
        20000: {
            port: 20000,
        }
    },
    plugins: {
        types: (options: ViteRunHandleFunctionOptions) => {
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
                    generateBundle(_: any, bundle: Record<any, any>) {
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
            lib: {
                entry: entryPath,
                name: options.name,
                fileName: (format: string) => `${options.name}.${format}.js`,
            },
            rollupOptions: {
                external: ['vite'],
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
