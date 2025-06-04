import type { Meta, StoryObj } from '@storybook/react-vite'
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
      fetchVersions: () => {
        return Promise.resolve({
          label: 'Branches',
          versions: [
            { label: 'master', sourceId: '/part1/part2/file.txt' },
            { label: 'dev', sourceId: '/part1/part2/file.txt?branch=dev' },
            { label: 'refs/convert/parquet', sourceId: '/part1/part2/file.txt?branch=refs/convert/parquet' },
          ],
        })
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
          <input type='text' placeholder="Search..." />
        </Breadcrumb>
      </ConfigProvider>
    )
  },
}
