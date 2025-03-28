import { createContext, useContext } from 'react'

/**
 * Config is a flat object of key-value pairs.
 *
 * Each key is generally the dromedaryCase name of a component. The namespace is global.
 *
 * It gives a way to pass additional values to the components, for example custom CSS classes.
 */
export interface Config {
  customClass?: {
    brand?: string
    contentWrapper?: string
    errorBar?: string
    highTable?: string
    imageView?: string
    markdownView?: string
    sideBar?: string
    slideCloseButton?: string
    slidePanel?: string
    spinner?: string
    textView?: string
    welcome?: string
  }
  routes?: {
    getSourceRouteUrl?: (params: { sourceId: string }) => string
    getCellRouteUrl?: (params: { sourceId: string, col: number, row: number }) => string
  }
  slidePanel?: {
    minWidth?: number
    defaultWidth?: number
  }
}

const ConfigContext = createContext<Config>({})

/**
 * Use the ConfigProvider to pass the Config object to the components that need it.
 *
 * Tip: memoize the Config object to avoid creating a new object on each render.
 *
 * @example
 * const config: Config = useMemo(() => ({
 *  highTable: {
 *   className: 'my-custom-class'
 *  }
 * }), [])
 *
 * return (
 *   <ConfigProvider value={config}>
 *     <MyComponent />
 *   </ConfigProvider>
 * )
 */
export const ConfigProvider = ConfigContext.Provider

/**
 * Use the useConfig hook to access the Config object in your components.
 *
 * @example
 * const { slidePanel } = useConfig()
 *
 * return (
 *   <div style={{ width: slidePanel?.defaultWidth }}>
 *     <MyComponent />
 *   </div>
 * )
 */
export function useConfig() {
  return useContext(ConfigContext)
}
