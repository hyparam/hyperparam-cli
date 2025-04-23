import type { Meta, StoryObj } from '@storybook/react'
import type { ComponentProps } from 'react'
import Json from './Json.js'

const meta: Meta<typeof Json> = {
  component: Json,
}
export default meta
type Story = StoryObj<typeof Json>;

function render(args: ComponentProps<typeof Json>) {
  return (
    <div style={{ padding: '2rem', backgroundColor: '#22222b' }}>
      <Json {...args} />
    </div>
  )
}

export const Default: Story = {
  args: {
    json: {
      a: 1,
      b: 'hello',
      c: [1, 2, 3],
      d: { e: 4, f: 5 },
    },
    label: 'json',
  },
  render,
}

export const Arrays: Story = {
  args: {
    json: {
      a: Array.from({ length: 100 }, (_, i) => i),
      b: Array.from({ length: 100 }, (_, i) => `hello ${i}`),
      c: Array.from({ length: 100 }, (_, i) => [i, i + 1, i + 2]),
    },
    label: 'json',
  },
  render,
}
