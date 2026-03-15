import type { RowGroup } from 'hyparquet'
import type { ExprNode } from 'squirreling/src/ast.js'
import { bbox, decompose, parseWkt } from 'squirreling/src/spatial/index.js'
import type { BoundingBox, Geometry } from 'squirreling/src/spatial/geometry.js'

export interface SpatialFilter {
  column: string
  queryBbox: BoundingBox
}

/**
 * Extract a spatial filter from a WHERE clause AST.
 * Matches patterns like ST_WITHIN(column, ST_GEOMFROMTEXT('...'))
 * where the first arg is a bare column ref and the second is a constant geometry.
 */
export function extractSpatialFilter(where: ExprNode | undefined): SpatialFilter | undefined {
  if (where?.type !== 'function') return
  if (where.funcName !== 'ST_WITHIN' && where.funcName !== 'ST_INTERSECTS') return
  const [first, second] = where.args
  if (first?.type !== 'identifier') return
  if (!second) return
  const geom = evaluateConstantGeom(second)
  if (!geom) return
  const queryBbox = geomBbox(geom)
  if (!queryBbox) return
  return { column: first.name, queryBbox }
}

/**
 * Try to evaluate a constant geometry expression from the AST.
 * Supports ST_GEOMFROMTEXT('...') and ST_MAKEENVELOPE(x1, y1, x2, y2).
 */
function evaluateConstantGeom(node: ExprNode): Geometry | undefined {
  if (node.type !== 'function') return
  if (node.funcName === 'ST_GEOMFROMTEXT') {
    const arg = node.args[0]
    if (node.args.length !== 1 || arg?.type !== 'literal') return
    if (typeof arg.value !== 'string') return
    return parseWkt(arg.value) ?? undefined
  }
  if (node.funcName === 'ST_MAKEENVELOPE') {
    if (node.args.length !== 4) return
    const nums = node.args.map(evaluateConstantNumber) as [number, number, number, number]
    if (nums.some(isNaN)) return
    const [xmin, ymin, xmax, ymax] = nums
    return {
      type: 'Polygon',
      coordinates: [[[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]]],
    }
  }
}

function evaluateConstantNumber(node: ExprNode): number {
  if (node.type !== 'literal') return NaN
  if (node.value === null) return NaN // Number(null) => 0
  return Number(node.value)
}

/**
 * Compute the bounding box of any geometry type.
 */
function geomBbox(geom: Geometry): BoundingBox | undefined {
  const parts = decompose(geom)
  if (parts.length === 0) return

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const part of parts) {
    const { minX: bMinX, minY: bMinY, maxX: bMaxX, maxY: bMaxY } = bbox(part)
    if (bMinX < minX) minX = bMinX
    if (bMinY < minY) minY = bMinY
    if (bMaxX > maxX) maxX = bMaxX
    if (bMaxY > maxY) maxY = bMaxY
  }
  return { minX, minY, maxX, maxY }
}

/**
 * Check if a row group's geospatial statistics overlap with a query bounding box.
 */
export function rowGroupOverlaps(rowGroup: RowGroup, { column, queryBbox }: SpatialFilter): boolean {
  for (const col of rowGroup.columns) {
    const pathName = col.meta_data?.path_in_schema.join('.')
    if (pathName !== column) continue
    const geoBbox = col.meta_data?.geospatial_statistics?.bbox
    if (!geoBbox) return true // no stats, can't skip
    return geoBbox.xmin <= queryBbox.maxX &&
      geoBbox.xmax >= queryBbox.minX &&
      geoBbox.ymin <= queryBbox.maxY &&
      geoBbox.ymax >= queryBbox.minY
  }
  return true // column not found, can't skip
}
