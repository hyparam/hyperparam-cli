import type { Meta, StoryObj } from '@storybook/react'
import { ConfigProvider } from '../../hooks/useConfig.js'
import Breadcrumb from './Breadcrumb.js'

const meta: Meta<typeof Breadcrumb> = {
  component: Breadcrumb,
}
export default meta
type Story = StoryObj<typeof Breadcrumb>;
export const Default: Story = {
  args: {
    source: {
      kind: 'file',
      sourceId: '/part1/part2/file.txt',
      fileName: 'file.txt',
      resolveUrl: '/part1/part2/file.txt',
      sourceParts: [
        { text: '/', sourceId: '/' },
        { text: 'part1/', sourceId: '/part1/' },
        { text: 'part2/', sourceId: '/part1/part2/' },
      ],
      versions: {
        label: 'Versions',
        versions: [
          { label: 'v1.0', sourceId: 'part1/part2/file.txt?version=v1.0' },
          { label: 'v2.0', sourceId: 'part1/part2/file.txt?version=v2.0' },
        ],
      },
    },
  },
  render: (args) => {
    const config = {
      routes: {
        getSourceRouteUrl: ({ sourceId }: { sourceId: string }) => `/files?key=${sourceId}`,
      },
      customClass: {
        versions: 'custom-versions',
      },
    }
    return (
      <ConfigProvider value={config}>
        <Breadcrumb {...args}>
          <div className="custom-search">SEARCH</div>
        </Breadcrumb>
      </ConfigProvider>
    )
  },
}
