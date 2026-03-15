declare module 'squirreling/src/spatial/bbox.js' {
  import type { BBox, SimpleGeometry } from 'squirreling/src/spatial/geometry.js'
  export function bbox(geom: SimpleGeometry): BBox
  export function bboxOverlap(a: SimpleGeometry, b: SimpleGeometry): boolean
}

declare module 'squirreling/src/spatial/wkt.js' {
  import type { Geometry } from 'squirreling/src/spatial/geometry.js'
  export function parseWkt(wkt: string): Geometry | null
}
