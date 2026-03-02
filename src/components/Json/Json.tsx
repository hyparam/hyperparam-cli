import { ReactNode, useState } from 'react'
import { cn } from '../../lib'
import styles from './Json.module.css'
import { isPrimitive, shouldObjectCollapse, stringifyPrimitive } from './helpers.js'
import { useWidth } from './useWidth.js'

const defaultPageLimit = 100

interface JsonProps {
  json: unknown
  label?: string
  className?: string
  expandRoot?: boolean // Expand the top-level object/array by default
  pageLimit?: number // Max items to render before showing "Show more..."
}

/**
 * JSON viewer component with collapsible objects and arrays.
 */
export default function Json({ json, label, className, expandRoot = true, pageLimit }: JsonProps): ReactNode {
  return <div className={cn(styles.json, className)} role="tree">
    <JsonContent json={json} label={label} expandRoot={expandRoot} pageLimit={pageLimit} />
  </div>
}

function JsonContent({ json, label, expandRoot, pageLimit }: JsonProps): ReactNode {
  let div
  if (Array.isArray(json)) {
    div = <JsonArray array={json} label={label} expandRoot={expandRoot} pageLimit={pageLimit} />
  } else if (json instanceof Date) {
    const key = label ? <span className={styles.key}>{label}: </span> : ''
    div = <>{key}<span className={styles.string}>{JSON.stringify(json)}</span></>
  } else if (typeof json === 'object' && json !== null) {
    div = <JsonObject label={label} obj={json} expandRoot={expandRoot} pageLimit={pageLimit} />
  } else {
    // primitive
    const key = label ? <span className={styles.key}>{label}: </span> : ''
    if (typeof json === 'string') {
      div = <>{key}<span className={styles.string}>{JSON.stringify(json)}</span></>
    } else if (typeof json === 'number') {
      div = <>{key}<span className={styles.number}>{JSON.stringify(json)}</span></>
    } else if (typeof json === 'bigint') {
      // it's not really json, but show it anyway
      div = <>{key}<span className={styles.number}>{json.toString()}</span></>
    } else if (json === undefined) {
      // it's not json
      div = <>{key}<span className={styles.other}>undefined</span></>
    } else {
      div = <>{key}<span className={styles.other}>{JSON.stringify(json)}</span></>
    }
  }
  return div
}

function CollapsedArray({ array }: {array: unknown[]}): ReactNode {
  const { elementRef, width } = useWidth<HTMLSpanElement>()
  const maxCharacterCount = Math.max(20, Math.floor(width / 8))
  const separator = ', '

  const children: ReactNode[] = []
  let suffix: string | undefined

  let characterCount = 0
  for (const [index, value] of array.entries()) {
    if (index > 0) {
      characterCount += separator.length
      children.push(<span key={`separator-${index - 1}`}>{separator}</span>)
    }
    // should we continue?
    if (isPrimitive(value)) {
      const asString = stringifyPrimitive(value)
      characterCount += asString.length
      if (characterCount < maxCharacterCount) {
        children.push(<JsonContent json={value} key={`value-${index}`} />)
        continue
      }
    }
    // no: it was the last entry
    children.push(<span key="rest">...</span>)
    suffix = ` length: ${array.length}`
    break
  }
  return (
    <>
      <span className={styles.array}>{'['}</span>
      <span ref={elementRef} className={styles.array}>{children}</span>
      <span className={styles.array}>{']'}</span>
      {suffix && <span className={styles.comment}>{suffix}</span>}
    </>
  )
}

function JsonArray({ array, label, expandRoot, pageLimit = defaultPageLimit }: { array: unknown[], label?: string, expandRoot?: boolean, pageLimit?: number }): ReactNode {
  const [collapsed, setCollapsed] = useState(!expandRoot && shouldObjectCollapse(array))
  const [limit, setLimit] = useState(pageLimit)
  const key = label ? <span className={styles.key}>{label}: </span> : ''
  if (collapsed) {
    return <div role="treeitem" className={styles.clickable} aria-expanded="false" onClick={() => { setCollapsed(false) }}>
      {key}
      <CollapsedArray array={array} />
    </div>
  }
  return <>
    <div role="treeitem" className={styles.clickable} aria-expanded="true" onClick={() => { setCollapsed(true) }}>
      {key}
      <span className={styles.array}>{'['}</span>
    </div>
    <ul role="group">
      {array.slice(0, limit).map((item, index) => <li key={index}><JsonContent json={item} /></li>)}
      {array.length > limit && <li>
        <button className={styles.showMore} onClick={() => { setLimit(limit + pageLimit) }}>Show more...</button>
      </li>}
    </ul>
    <div className={styles.array}>{']'}</div>
  </>
}

function CollapsedObject({ obj }: { obj: object }): ReactNode {
  const { elementRef, width } = useWidth<HTMLSpanElement>()
  const maxCharacterCount = Math.max(20, Math.floor(width / 8))
  const separator = ', '
  const kvSeparator = ': '

  const children: ReactNode[] = []
  let suffix: string | undefined

  const entries = Object.entries(obj)
  let characterCount = 0
  for (const [index, [key, value]] of entries.entries()) {
    if (index > 0) {
      characterCount += separator.length
      children.push(<span key={`separator-${index - 1}`}>{separator}</span>)
    }
    // should we continue?
    if (isPrimitive(value)) {
      const asString = stringifyPrimitive(value)
      characterCount += key.length + kvSeparator.length + asString.length
      if (characterCount < maxCharacterCount) {
        children.push(<JsonContent json={value as unknown} label={key} key={`value-${index}`} />)
        continue
      }
    }
    // no: it was the last entry
    children.push(<span key="rest">...</span>)
    suffix = ` entries: ${entries.length}`
    break
  }
  return (
    <>
      <span className={styles.object}>{'{'}</span>
      <span ref={elementRef} className={styles.object}>{children}</span>
      <span className={styles.object}>{'}'}</span>
      {suffix && <span className={styles.comment}>{suffix}</span>}
    </>
  )
}

function JsonObject({ obj, label, expandRoot, pageLimit = defaultPageLimit }: { obj: object, label?: string, expandRoot?: boolean, pageLimit?: number }): ReactNode {
  const [collapsed, setCollapsed] = useState(!expandRoot && shouldObjectCollapse(obj))
  const [limit, setLimit] = useState(pageLimit)
  const key = label ? <span className={styles.key}>{label}: </span> : ''
  if (collapsed) {
    return <div role="treeitem" className={styles.clickable} aria-expanded="false" onClick={() => { setCollapsed(false) }}>
      {key}
      <CollapsedObject obj={obj} />
    </div>
  }
  const entries = Object.entries(obj)
  return <>
    <div role="treeitem" className={styles.clickable} aria-expanded="true" onClick={() => { setCollapsed(true) }}>
      {key}
      <span className={styles.object}>{'{'}</span>
    </div>
    <ul role="group">
      {entries.slice(0, limit).map(([key, value]) =>
        <li key={key}>
          <JsonContent json={value as unknown} label={key} />
        </li>
      )}
      {entries.length > limit && <li>
        <button className={styles.showMore} onClick={() => { setLimit(limit + pageLimit) }}>Show more...</button>
      </li>}
    </ul>
    <div className={styles.object}>{'}'}</div>
  </>
}
