import { ColumnData, ParquetReadOptions, parquetRead } from 'hyparquet'

type GetColumnOptions = Omit<ParquetReadOptions, 'columns' | 'rowStart' | 'rowEnd' | 'onChunk' | 'onComplete'> & {column: string}

export async function getParquetColumn({ metadata, file, column, compressors }: GetColumnOptions): Promise<unknown[]> {
  const numRows = Number(metadata?.num_rows)
  if (isNaN(numRows)) {
    throw new Error('metadata.num_rows is undefined')
  }
  if (numRows === 0) {
    return []
  }
  const lastError: {error?: Error} = {}
  const values: unknown[] = Array(numRows).fill(undefined)
  const ranges: [number, number][] = []
  function onChunk({ columnName, columnData, rowStart, rowEnd }: ColumnData) {
    if (columnName !== column) {
      lastError.error = new Error(`unexpected column name ${columnName}`)
    }
    for (let i = rowStart; i < rowEnd; i++) {
      values[i] = columnData[i - rowStart]
    }
    ranges.push([rowStart, rowEnd])
  }

  // this awaits all the promises. When it returns, all the data should have already been sent using onChunk
  await parquetRead({ metadata, file, columns: [column], compressors, onChunk })

  // Do some checks before returning the data

  // check for errors
  if (lastError.error !== undefined) {
    throw lastError.error
  }

  // check for missing data (should be faster than checking for undefined values in the array)
  const sortedRanges = ranges.sort((a, b) => a[0] - b[0])
  for (let i = 0; i < sortedRanges.length - 1; i++) {
    const range = sortedRanges[i]
    const nextRange = sortedRanges[i + 1]
    if (!range || !nextRange) {
      throw new Error('The ranges should not be undefined')
    }
    if (range[1] !== nextRange[0]) {
      throw new Error(`missing data between rows ${range[1]} and ${nextRange[0]}`)
    }
  }
  const firstRange = sortedRanges[0]
  if (!firstRange) {
    throw new Error('The first range should not be undefined')
  }
  if (firstRange[0] !== 0) {
    throw new Error(`missing data before row ${firstRange[0]}`)
  }
  const lastRange = sortedRanges[sortedRanges.length - 1]
  if (!lastRange) {
    throw new Error('The last range should not be undefined')
  }
  if (lastRange[1] !== numRows) {
    throw new Error(`missing data after row ${lastRange[1]}`)
  }

  // return the values
  return values
}
