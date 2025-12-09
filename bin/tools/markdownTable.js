
/**
 * Convert an array of objects to a markdown table string.
 * Truncates cell values to maxChars, appending '…' if truncated.
 * Marks columns as "(truncated)" in the header if any cell was truncated.
 * @param {Record<string, any>[]} data
 * @param {number} maxChars
 * @returns {string}
 */
export function markdownTable(data, maxChars) {
  if (data.length === 0) {
    return '(empty table)'
  }
  const columns = Object.keys(data[0] ?? {})
  const truncated = columns.map(() => false) // is column truncated?
  /** @type {string[]} */
  const rows = []
  for (const row of data) {
    const rowStrings = new Array(columns.length)
    for (let i = 0; i < columns.length; i++) {
      const column = columns[i]
      const value = column && row[column]
      if (value === null || value === undefined) {
        rowStrings[i] = ''
      } else if (typeof value === 'object') {
        const { json, isTruncated } = jsonStringify(value, maxChars)
        if (isTruncated) truncated[i] = true
        rowStrings[i] = json.replace(/\|/g, '\\|') // Escape pipe characters
      } else {
        let str = String(value)
        if (str.length > maxChars) {
          str = str.slice(0, maxChars) + '…'
          truncated[i] = true
        }
        rowStrings[i] = str.replace(/\|/g, '\\|') // Escape pipe characters
      }
    }
    rows.push(`| ${rowStrings.join(' | ')} |`)
  }
  // Show which columns were truncated in the header
  const columnsWithTruncation = columns
    .map((col, idx) => truncated[idx] ? `${col} (truncated)` : col)
  const header = `| ${columnsWithTruncation.join(' | ')} |`
  const separator = `| ${columns.map(() => '---').join(' | ')} |`

  return [header, separator, ...rows].join('\n')
}

/**
 * JSON stringify with truncation.
 * @param {unknown} obj
 * @param {number} maxChars
 * @returns {{json: string, isTruncated: boolean}}
 */
function jsonStringify(obj, maxChars) {
  const fullJson = JSON.stringify(obj)
  if (fullJson.length <= maxChars) {
    return { json: fullJson, isTruncated: false }
  }
  const sliced = fullJson.slice(0, maxChars) + '…'
  return { json: sliced, isTruncated: true }
}
