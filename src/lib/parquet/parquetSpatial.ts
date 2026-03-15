import type { RowGroup } from 'hyparquet'
import { bbox } from 'squirreling/src/spatial/bbox.js'
import { parseWkt } from 'squirreling/src/spatial/wkt.js'
import type { ExprNode } from 'squirreling/src/ast.js'
import type { BBox, Geometry, SimpleGeometry } from 'squirreling/src/spatial/geometry.js'

export interface SpatialFilter {
  column: string
  queryBbox: BBox
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
    if (node.args.length < 4) return
    const nums = node.args.slice(0, 4).map(a => a.type === 'literal' ? Number(a.value) : NaN)
    if (nums.some(n => isNaN(n))) return
    const [xmin = 0, ymin = 0, xmax = 0, ymax = 0] = nums
    return {
      type: 'Polygon' as const,
      coordinates: [[[xmin, ymin], [xmax, ymin], [xmax, ymax], [xmin, ymax], [xmin, ymin]]],
    }
  }
}

/**
 * Compute the bounding box of any geometry type.
 */
function geomBbox(geom: Geometry): BBox | undefined {
  if (geom.type === 'Point' || geom.type === 'LineString' || geom.type === 'Polygon') {
    return bbox(geom)
  }
  let parts: SimpleGeometry[]
  if (geom.type === 'MultiPoint') {
    parts = geom.coordinates.map(c => ({ type: 'Point' as const, coordinates: c }))
  } else if (geom.type === 'MultiLineString') {
    parts = geom.coordinates.map(c => ({ type: 'LineString' as const, coordinates: c }))
  } else if (geom.type === 'MultiPolygon') {
    parts = geom.coordinates.map(c => ({ type: 'Polygon' as const, coordinates: c }))
  } else {
    return // GeometryCollection - not worth the complexity
  }
  if (!parts.length) return
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
