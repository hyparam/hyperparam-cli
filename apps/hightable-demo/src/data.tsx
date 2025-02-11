import { AsyncRow, rowCache, sortableDataFrame, wrapPromise } from 'hightable'

function lorem(rand: number, length: number): string {
  const words = 'lorem ipsum dolor sit amet consectetur adipiscing elit'.split(' ')
  const str = Array.from({ length }, (_, i) => words[Math.floor(i + rand * 8) % 8]).join(' ')
  return str[0].toUpperCase() + str.slice(1)
}

function delay<T>(value: T, ms: number): Promise<T> {
  return new Promise(resolve => setTimeout(() => { resolve(value) }, ms))
}

const header = ['ID', 'Name', 'Age', 'UUID', 'Text', 'JSON']
const mockData = {
  header,
  numRows: 10000,
  rows(start: number, end: number) {
    const arr: AsyncRow[] = []
    for (let i = start; i < end; i++) {
      const rand = Math.abs(Math.sin(i + 1))
      const uuid = rand.toString(16).substring(2)
      const partial = {
        ID: i + 1,
        Name: `Name${i}`,
        Age: 20 + i % 80,
        UUID: uuid,
        Text: lorem(rand, 100),
      }
      const row = { ...partial, JSON: JSON.stringify(partial) }
      // Map to randomly delayed promises
      const cells = Object.fromEntries(Object.entries(row).map(([key, value]) =>
        // discrete time delay for each cell to simulate async data loading
        [key, wrapPromise(delay(value, 100 * Math.floor(10 * Math.random())))],
      ))
      arr.push({
        index: wrapPromise(i),
        cells,
      })
    }
    return arr
  },
}

export const data = rowCache(sortableDataFrame(mockData))
