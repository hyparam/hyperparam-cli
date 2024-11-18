type WrappedPromise<T> = Promise<T> & {
  resolved?: T
  rejected?: Error
}

/**
 * A row where each cell is a promise.
 * The promise must be wrapped with `wrapPromise` so that HighTable can render
 * the state synchronously.
 */
export type AsyncRow = Record<string, WrappedPromise<unknown>>

/**
 * A row where each cell is a resolved value.
 */
export type Row = Record<string, unknown>

/**
 * Streamable row data
 */
export interface DataFrame {
  header: string[]
  numRows: number
  // Rows are 0-indexed, excludes the header, end is exclusive
  rows(start: number, end: number, orderBy?: string): AsyncRow[] | Promise<Row[]>
  sortable?: boolean
}

export function resolvableRow(header: string[]): Record<string, ResolvablePromise<unknown>> {
  return Object.fromEntries(header.map(key => [key, resolvablePromise<unknown>()]))
}

/**
 * Helper method to wrap future rows into AsyncRows.
 * Helpful when you want to define a DataFrame with simple async fetching of rows.
 * This function turns future data into a "grid" of wrapped promises.
 */
export function asyncRows(rows: AsyncRow[] | Promise<Row[]>, numRows: number, header: string[]): AsyncRow[] {
  if (Array.isArray(rows)) return rows
  // Make grid of resolvable promises
  const wrapped = new Array(numRows).fill(null).map(() => resolvableRow(header))
  rows.then(rows => {
    if (rows.length !== numRows) {
      console.warn(`Expected ${numRows} rows, got ${rows.length}`)
    }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      for (const key of header) {
        wrapped[i][key].resolve(row[key])
      }
    }
  }).catch((error: unknown) => {
    const rejected = error instanceof Error ? error : new Error(String(error))
    // Reject all promises on error
    for (let i = 0; i < numRows; i++) {
      for (const key of header) {
        wrapped[i][key].reject(rejected)
      }
    }
  })
  return wrapped
}

/**
 * Wrap a promise to save the resolved value and error.
 * Note: you can't await on a WrappedPromise, you must use then.
 */
export function wrapPromise<T>(promise: Promise<T> | T): WrappedPromise<T> {
  if (!(promise instanceof Promise)) {
    promise = Promise.resolve(promise)
  }
  const wrapped: WrappedPromise<T> = promise.then(resolved => {
    wrapped.resolved = resolved
    return resolved
  }).catch((error: unknown) => {
    wrapped.rejected = error instanceof Error ? error : new Error(String(error))
    throw error
  })
  return wrapped
}

export type ResolvablePromise<T> = Promise<T> & {
  resolve: (value: T) => void
  reject: (error: Error) => void
}

/**
 * Create a promise that can be resolved or rejected later using the resolve and reject methods.
 * It's also a wrapped promise, with resolved and rejected properties.
 */
export function resolvablePromise<T>(): ResolvablePromise<T> & WrappedPromise<T> {
  const promise = Promise.withResolvers<T>()
  const wrapped = Object.assign(
    wrapPromise(promise.promise),
    {
      resolve: promise.resolve,
      reject : promise.reject,
    },
  )
  return wrapped
}

/**
 * Wraps a DataFrame to make it sortable.
 * Requires fetching all rows to sort.
 */
export function sortableDataFrame(data: DataFrame): DataFrame {
  if (data.sortable) return data // already sortable
  // Fetch all rows and add __index__ column
  let all: Promise<Row[]> | undefined
  return {
    ...data,
    rows(start: number, end: number, orderBy?: string): AsyncRow[] | Promise<Row[]> {
      if (orderBy) {
        if (!data.header.includes(orderBy)) {
          throw new Error(`Invalid orderBy field: ${orderBy}`)
        }
        if (!all) {
          // Fetch all rows and add __index__ column
          all = awaitRows(data.rows(0, data.numRows))
            .then(rows => rows.map((row, i) => ({ __index__: i, ...row })))
        }
        const sorted = all.then(all => {
          return all.sort((a, b) => {
            /// TODO(SL): rewrite the function, handling every case
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const valueA: any = a[orderBy]
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const valueB: any = b[orderBy]
            if (valueA < valueB) return -1
            if (valueA > valueB) return 1
            return 0
          }).slice(start, end)
        })
        return sorted
      } else {
        return data.rows(start, end)
      }
    },
    sortable: true,
  }
}

/**
 * Await all promises in an AsyncRow and return resolved row.
 */
export async function awaitRow(row: AsyncRow): Promise<Row> {
  const values = await Promise.all(Object.values(row))
  return Object.fromEntries(Object.keys(row).map((key, i) => [key, values[i]]))
}

/**
 * Await all promises in list of AsyncRows and return resolved rows.
 */
export function awaitRows(rows: AsyncRow[] | Promise<Row[]>): Promise<Row[]> {
  if (rows instanceof Promise) return rows
  return Promise.all(rows.map(awaitRow))
}

export function arrayDataFrame(data: Row[]): DataFrame {
  if (!data.length) return { header: [], numRows: 0, rows: () => Promise.resolve([]) }
  return {
    header: Object.keys(data[0]),
    numRows: data.length,
    rows(start: number, end: number): Promise<Row[]> {
      return Promise.resolve(data.slice(start, end))
    },
  }
}