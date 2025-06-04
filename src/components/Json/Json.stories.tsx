import type { Meta, StoryObj } from '@storybook/react-vite'
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
      e: null,
      f: undefined,
      g: true,
      // h: 123456n, // commented because it breaks storybook...
    },
    label: 'json',
  },
  render,
}

export const Arrays: Story = {
  args: {
    json: {
      empty: [],
      numbers1: Array.from({ length: 1 }, (_, i) => i),
      numbers8: Array.from({ length: 8 }, (_, i) => i),
      numbers100: Array.from({ length: 100 }, (_, i) => i),
      strings2: Array.from({ length: 2 }, (_, i) => `hello ${i}`),
      strings8: Array.from({ length: 8 }, (_, i) => `hello ${i}`),
      strings100: Array.from({ length: 100 }, (_, i) => `hello ${i}`),
      misc: Array.from({ length: 8 }, (_, i) => i % 2 ? `hello ${i}` : i),
      misc2: Array.from({ length: 8 }, (_, i) => i % 3 === 0 ? i : i % 3 === 1 ? `hello ${i}` : [i, i + 1, i + 2]),
      misc3: [1, 'hello', null, undefined],
      arrays100: Array.from({ length: 100 }, (_, i) => [i, i + 1, i + 2]),
    },
    label: 'json',
  },
  render,
}

export const Objects: Story = {
  args: {
    json: {
      empty: {},
      numbers1: { k0: 1 },
      numbers8: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`k${i}`, i])),
      numbers100: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`k${i}`, i])),
      strings8: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`k${i}`, `hello ${i}`])),
      strings100: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`k${i}`, `hello ${i}`])),
      misc: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`k${i}`, i % 2 ? `hello ${i}` : i])),
      misc2: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [`k${i}`, i % 3 === 0 ? i : i % 3 === 1 ? `hello ${i}` : [i, i + 1, i + 2]])),
      misc3: { k0: 1, k1: 'a', k2: null, k3: undefined },
      arrays100: Object.fromEntries(Array.from({ length: 100 }, (_, i) => [`k${i}`, [i, i + 1, i + 2]])),
    },
    label: 'json',
  },
  render,
}
