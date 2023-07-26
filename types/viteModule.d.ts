// @start-copy

export declare module 'vite' {
  /** 透传配置，挂载到vite的config上 */
  export type ViteRunTransmissionConfig = {
    appName:string
    group: Array<any>
    type: 'build' | 'preview' | 'server'
    config: Record<any, any>
  }

  export interface UserConfig {
    viteRun?: ViteRunTransmissionConfig
  }
}
