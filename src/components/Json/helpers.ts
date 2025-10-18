export function isPrimitive(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    !Array.isArray(value) &&
    typeof value !== 'object' &&
    typeof value !== 'function' &&
    typeof value !== 'string' // exception: don't consider strings as primitive here
  )
}

export function shouldObjectCollapse(obj: object): boolean {
  const values = Object.values(obj)
  if (
    // if all the values are primitive
    values.every(value => isPrimitive(value))
      // if the object has too many entries
      || values.length >= 100
  ) {
    return true
  }
  return false
}
