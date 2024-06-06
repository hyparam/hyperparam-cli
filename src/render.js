import HighTable from 'hightable'
import React from 'react'
import ReactDOM from 'react-dom'

const header = ['ID', 'Name', 'Age', 'UUID', 'JSON']
const data = {
  header,
  numRows: 10000,
  /**
   * @param {number} start
   * @param {number} end
   * @returns {Promise<any[][]>}
   */
  async rows(start, end) {
    const arr = []
    for (let i = start; i < end; i++) {
      const uuid = Math.random().toString(16).substring(2)
      const row = [i + 1, 'Name' + i, 20 + i, uuid]
      const object = Object.fromEntries(header.map((key, index) => [key, row[index]]))
      arr.push([...row, object])
    }
    return arr
  },
}

function render() {
  const app = document.getElementById('app')
  if (!app) throw new Error('missing app element')

  // @ts-expect-error TODO: fix react createRoot type
  const root = ReactDOM.createRoot(app)
  root.render(React.createElement(HighTable, { data }))
}
render()
