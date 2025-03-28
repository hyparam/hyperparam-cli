import { render } from '@testing-library/react'
import { strict as assert } from 'assert'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { Config, ConfigProvider } from '../../src/hooks/useConfig.js'
import { Breadcrumb, getHyperparamSource } from '../../src/index.js'

const endpoint = 'http://localhost:3000'

describe('Breadcrumb Component', () => {
  it('renders breadcrumbs correctly', () => {
    const source = getHyperparamSource('subdir1/subdir2/', { endpoint })
    assert(source !== undefined)

    const config: Config = {
      routes: {
        getSourceRouteUrl: ({ sourceId }) => `/files?key=${sourceId}`,
      },
    }
    const { getByText } = render(<ConfigProvider value={config}>
      <Breadcrumb source={source} />
    </ConfigProvider>)

    const subdir1Link = getByText('subdir1/')
    expect(subdir1Link.closest('a')?.getAttribute('href')).toBe('/files?key=subdir1/')

    const subdir2Link = getByText('subdir2/')
    expect(subdir2Link.closest('a')?.getAttribute('href')).toBe('/files?key=subdir1/subdir2/')
  })
})
