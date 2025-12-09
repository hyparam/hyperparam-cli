/**
 * Converts a WHERE clause AST to hyparquet filter format.
 * Returns undefined if the expression cannot be fully converted.
 *
 * @param {import('squirreling/src/types.js').ExprNode | undefined} where
 * @returns {import('hyparquet').ParquetQueryFilter | undefined}
 */
export function whereToParquetFilter(where) {
  if (!where) return undefined
  return convertExpr(where, false)
}

/**
 * Converts an expression node to filter format
 *
 * @param {import('squirreling/src/types.js').ExprNode} node
 * @param {boolean} negate
 * @returns {import('hyparquet').ParquetQueryFilter | undefined}
 */
function convertExpr(node, negate) {
  if (node.type === 'unary' && node.op === 'NOT') {
    return convertExpr(node.argument, !negate)
  }
  if (node.type === 'binary') {
    return convertBinary(node, negate)
  }
  if (node.type === 'in valuelist') {
    return convertInValues(node, negate)
  }
  if (node.type === 'cast') {
    return convertExpr(node.expr, negate)
  }
  // Non-convertible types - return undefined to skip optimization
  return undefined
}

/**
 * Converts a binary expression to filter format
 *
 * @param {import('squirreling/src/types.js').BinaryNode} node
 * @param {boolean} negate
 * @returns {import('hyparquet').ParquetQueryFilter | undefined}
 */
function convertBinary({ op, left, right }, negate) {
  if (op === 'AND') {
    const leftFilter = convertExpr(left, negate)
    const rightFilter = convertExpr(right, negate)
    if (!leftFilter || !rightFilter) return
    return negate
      ? { $or: [leftFilter, rightFilter] }
      : { $and: [leftFilter, rightFilter] }
  }
  if (op === 'OR') {
    const leftFilter = convertExpr(left, false)
    const rightFilter = convertExpr(right, false)
    if (!leftFilter || !rightFilter) return
    return negate
      ? { $nor: [leftFilter, rightFilter] }
      : { $or: [leftFilter, rightFilter] }
  }

  // LIKE is not supported by hyparquet filters
  if (op === 'LIKE') return

  // Comparison operators: need identifier on one side and literal on the other
  const { column, value, flipped } = extractColumnAndValue(left, right)
  if (!column || value === undefined) return

  // Map SQL operator to MongoDB operator
  const mongoOp = mapOperator(op, flipped, negate)
  if (!mongoOp) return
  return { [column]: { [mongoOp]: value } }
}

/**
 * Extracts column name and literal value from binary operands.
 * Handles both "column op value" and "value op column" patterns.
 *
 * @param {import('squirreling/src/types.js').ExprNode} left
 * @param {import('squirreling/src/types.js').ExprNode} right
 * @returns {{ column: string | undefined; value: import('squirreling/src/types.js').SqlPrimitive | undefined; flipped: boolean }}
 */
function extractColumnAndValue(left, right) {
  // column op value
  if (left.type === 'identifier' && right.type === 'literal') {
    return { column: left.name, value: right.value, flipped: false }
  }
  // value op column (flipped)
  if (left.type === 'literal' && right.type === 'identifier') {
    return { column: right.name, value: left.value, flipped: true }
  }
  // Neither pattern matches
  return { column: undefined, value: undefined, flipped: false }
}

/**
 * Maps SQL operator to MongoDB operator, accounting for flipped operands
 *
 * @param {import('squirreling/src/types.js').BinaryOp} op
 * @param {boolean} flipped
 * @param {boolean} negate
 * @returns {string | undefined}
 */
function mapOperator(op, flipped, negate) {
  if (!isBinaryOp(op)) return

  let mappedOp = op
  if (negate) mappedOp = neg(mappedOp)
  if (flipped) mappedOp = flip(mappedOp)
  // Symmetric operators (same when flipped)
  if (mappedOp === '=') return '$eq'
  if (mappedOp === '!=' || mappedOp === '<>') return '$ne'
  if (mappedOp === '<') return '$lt'
  if (mappedOp === '<=') return '$lte'
  if (mappedOp === '>') return '$gt'
  if (mappedOp === '>=') return '$gte'
}

/**
 * @param {import('squirreling/src/types.js').ComparisonOp} op
 * @returns {import('squirreling/src/types.js').ComparisonOp}
 */
function neg(op) {
  if (op === '<') return '>='
  if (op === '<=') return '>'
  if (op === '>') return '<='
  if (op === '>=') return '<'
  if (op === '=') return '!='
  if (op === '!=') return '='
  if (op === '<>') return '='
  throw new Error(`Unexpected comparison operator: ${op}`)
}

/**
 * @param {import('squirreling/src/types.js').ComparisonOp} op
 * @returns {import('squirreling/src/types.js').ComparisonOp}
 */
function flip(op) {
  if (op === '<') return '>'
  if (op === '<=') return '>='
  if (op === '>') return '<'
  if (op === '>=') return '<='
  if (op === '=') return '='
  if (op === '!=') return '!='
  if (op === '<>') return '='
  throw new Error(`Unexpected comparison operator: ${op}`)
}

/**
 * @param {string} op
 * @returns {op is import('squirreling/src/types.js').ComparisonOp}
 */
export function isBinaryOp(op) {
  return ['AND', 'OR', 'LIKE', '=', '!=', '<>', '<', '>', '<=', '>='].includes(op)
}

/**
 * Converts IN/NOT IN value list expression to filter format
 *
 * @param {import('squirreling/src/types.js').InValuesNode} node
 * @param {boolean} negate
 * @returns {import('hyparquet').ParquetQueryFilter | undefined}
 */
function convertInValues(node, negate) {
  if (node.expr.type !== 'identifier') return

  // All values must be literals
  const values = []
  for (const val of node.values) {
    if (val.type !== 'literal') return
    values.push(val.value)
  }

  return { [node.expr.name]: { [negate ? '$nin' : '$in']: values } }
}
