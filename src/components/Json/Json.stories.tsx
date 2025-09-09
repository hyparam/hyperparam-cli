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

export const OpenAICompletions: Story = {
  args: {
    json: {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that explains complex concepts clearly.',
        },
        {
          role: 'user',
          content: 'Can you explain how machine learning works?',
        },
        {
          role: 'assistant',
          content: 'Machine learning is a method of data analysis that automates analytical model building. It uses algorithms that iteratively learn from data, allowing computers to find hidden insights without being explicitly programmed where to look.',
        },
        {
          role: 'user',
          content: 'What are the main types of machine learning?',
        },
      ],
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1.0,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
    },
  },
  render,
}

export const MessagesList: Story = {
  args: {
    json: [
      {
        role: 'user',
        content: 'Hello, how are you today?',
      },
      {
        role: 'assistant',
        content: 'I\'m doing well, thank you for asking! How can I help you today?',
      },
      {
        role: 'user',
        content: 'I need help with debugging a JavaScript function that\'s not working correctly.',
      },
      {
        role: 'assistant',
        content: 'I\'d be happy to help you debug your JavaScript function. Could you please share the code that\'s causing issues?',
      },
      {
        role: 'user',
        content: 'Sure, here it is: function calculate(a, b) { return a + b * c; }',
      },
      {
        role: 'assistant',
        content: 'I can see the issue! The variable `c` is not defined in your function. You\'re using `c` but it\'s not a parameter or declared variable. You probably want either `function calculate(a, b, c)` or just `return a + b` depending on your intended calculation.',
      },
    ],
  },
  render,
}
