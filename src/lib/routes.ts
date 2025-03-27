/**
 * Replace the search params in the current url.
 *
 * @param [params] the new search params. If undefined, all search params are removed, unless options.appendOnly is set to true.
 * @param [options] object
 * @param [options.appendOnly] if true, only the search params in the URL are appended
 * @returns the URL with the search params replaced
 */
export function replaceSearchParams(params?: Record<string, string>, options?: {appendOnly?: boolean}): string {
  const url = new URL(location.href)
  if (!options?.appendOnly) {
    url.search = ''
  }
  if (params !== undefined) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value)
    }
  }
  return url.toString()
}

/**
 * Append the search params in the current url.
 *
 * @param [params] the new search params. If undefined, the same URL is returned.
 * @returns the URL with the search params replaced
 */
export function appendSearchParams(params?: Record<string, string>): string {
  return replaceSearchParams(params, { appendOnly: true })
}
