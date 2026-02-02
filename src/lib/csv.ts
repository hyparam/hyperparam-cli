/**
 * Parse CSV text into nested array of rows and columns.
 */
export function parseCsv(text: string): string[][] {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let previousCharWasQuote = false

  for (const char of text) {

    if (inQuotes && char === '"' && !previousCharWasQuote) {
      // first quote, wait to see if it's escaped or end of field
      previousCharWasQuote = true
    } else if (inQuotes && char === '"' && previousCharWasQuote) {
      // csv escaped quote ##
      field += char
      previousCharWasQuote = false
    } else if (inQuotes && !previousCharWasQuote) {
      // append quoted character to field
      field += char
    } else {
      // not in quotes
      inQuotes = false
      previousCharWasQuote = false
      switch (char) {
        case ',':
          // emit column
          row.push(field)
          field = ''
          break
        case '\n':
          // emit row
          row.push(field)
          rows.push(row)
          row = []
          field = ''
          break
        case '"':
          inQuotes = true
          break
        default:
          field += char
      }
    }
  }

  if (inQuotes && !previousCharWasQuote) {
    console.error('csv unterminated quote')
  }

  // handle last field and row, but skip empty last line
  if (field || row.length) {
    row.push(field)
    rows.push(row)
  }

  return rows
}
