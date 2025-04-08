import type { Meta, StoryObj } from '@storybook/react'
import Dropdown from './Dropdown.js'

const meta: Meta<typeof Dropdown> = {
  component: Dropdown,
}
export default meta
type Story = StoryObj<typeof Dropdown>;
export const Default: Story = {
  args: {
    label: 'Menu',
    children: <>
      <button>Item 1</button>
      <button>Item 2</button>
    </>,
  },
}

export const LeftAlign: Story = {
  args: {
    label: 'Menu',
    align: 'left',
    children: <>
      <button>Item 1</button>
      <button>Item 2</button>
    </>,
  },
}

export const RightAlign: Story = {
  args: {
    label: 'Very long label for the menu',
    align: 'right',
    children: <>
      <button>Item 1</button>
      <button>Item 2</button>
    </>,
  },
}
