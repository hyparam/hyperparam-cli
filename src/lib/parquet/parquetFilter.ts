import type { ParquetQueryFilter } from 'hyparquet'
import type { BinaryNode, BinaryOp, ComparisonOp, ExprNode, InValuesNode, SqlPrimitive } from 'squirreling/src/ast.js'

/**
 * Converts a WHERE clause AST to hyparquet filter format.
 * Returns undefined if the expression cannot be fully converted.
 */
export function whereToParquetFilter(where: ExprNode | undefined): ParquetQueryFilter | undefined {
  if (!where) return undefined
  return convertExpr(where, false)
}

function convertExpr(node: ExprNode, negate: boolean): ParquetQueryFilter | undefined {
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
  return undefined
}

function convertBinary({ op, left, right }: BinaryNode, negate: boolean): ParquetQueryFilter | undefined {
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

  if (op === 'LIKE') return

  const { column, value, flipped } = extractColumnAndValue(left, right)
  if (!column || value === undefined) return

  const mongoOp = mapOperator(op, flipped, negate)
  if (!mongoOp) return
  return { [column]: { [mongoOp]: value } }
}

function extractColumnAndValue(left: ExprNode, right: ExprNode): { column: string | undefined; value: SqlPrimitive | undefined; flipped: boolean } {
  if (left.type === 'identifier' && right.type === 'literal') {
    return { column: left.name, value: right.value, flipped: false }
  }
  if (left.type === 'literal' && right.type === 'identifier') {
    return { column: right.name, value: left.value, flipped: true }
  }
  return { column: undefined, value: undefined, flipped: false }
}

export function isBinaryOp(op: string): op is ComparisonOp {
  return ['AND', 'OR', 'LIKE', '=', '!=', '<>', '<', '>', '<=', '>='].includes(op)
}

function mapOperator(op: BinaryOp, flipped: boolean, negate: boolean): string | undefined {
  if (!isBinaryOp(op)) return

  let mappedOp: ComparisonOp = op
  if (negate) mappedOp = neg(mappedOp)
  if (flipped) mappedOp = flip(mappedOp)
  switch (mappedOp) {
    case '=': return '$eq'
    case '!=': case '<>': return '$ne'
    case '<': return '$lt'
    case '<=': return '$lte'
    case '>': return '$gt'
    case '>=': return '$gte'
  }
}

function neg(op: ComparisonOp): ComparisonOp {
  switch (op) {
    case '<': return '>='
    case '<=': return '>'
    case '>': return '<='
    case '>=': return '<'
    case '=': return '!='
    case '!=': return '='
    case '<>': return '='
  }
}

function flip(op: ComparisonOp): ComparisonOp {
  switch (op) {
    case '<': return '>'
    case '<=': return '>='
    case '>': return '<'
    case '>=': return '<='
    case '=': return '='
    case '!=': return '!='
    case '<>': return '='
  }
}

function convertInValues(node: InValuesNode, negate: boolean): ParquetQueryFilter | undefined {
  if (node.expr.type !== 'identifier') return

  const values: SqlPrimitive[] = []
  for (const val of node.values) {
    if (val.type !== 'literal') return
    values.push(val.value)
  }

  return { [node.expr.name]: { [negate ? '$nin' : '$in']: values } }
}
