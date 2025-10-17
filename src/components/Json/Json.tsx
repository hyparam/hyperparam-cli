import { ReactNode, useState } from 'react'
import styles from './Json.module.css'
import { isPrimitive, shouldObjectCollapse } from './helpers.js'
import { cn } from '../../lib'
import { useWidth } from './useWidth.js'

interface JsonProps {
  json: unknown
  label?: string
  className?: string
}

/**
 * JSON viewer component with collapsible objects and arrays.
 */
export default function Json({ json, label, className }: JsonProps): ReactNode {
  return <div className={cn(styles.json, className)} role="tree">
    <JsonContent json={json} label={label} />
  </div>
}

function JsonContent({ json, label }: JsonProps): ReactNode {
  let div
  if (Array.isArray(json)) {
    div = <JsonArray array={json} label={label} />
  } else if (typeof json === 'object' && json !== null) {
    div = <JsonObject label={label} obj={json} />
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
  let suffix: string | undefined = undefined

  let characterCount = 0
  for (const [index, value] of array.entries()) {
    if (index > 0) {
      characterCount += separator.length
      children.push(<span key={`separator-${index - 1}`}>{separator}</span>)
    }
    // should we continue?
    if (isPrimitive(value)) {
      const asString = typeof value === 'bigint' ? value.toString() :
        value === undefined ? 'undefined' /* see JsonContent - even if JSON.stringify([undefined]) === '[null]' */:
          JSON.stringify(value)
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

function JsonArray({ array, label }: { array: unknown[], label?: string }): ReactNode {
  const [collapsed, setCollapsed] = useState(shouldObjectCollapse(array))
  const key = label ? <span className={styles.key}>{label}: </span> : ''
  if (collapsed) {
    return <div role="treeitem" className={styles.clickable} aria-expanded="false" onClick={() => { setCollapsed(false) }}>
      {key}
      <CollapsedArray array={array}></CollapsedArray>
    </div>
  }
  return <>
    <div role="treeitem" className={styles.clickable} aria-expanded="true" onClick={() => { setCollapsed(true) }}>
      {key}
      <span className={styles.array}>{'['}</span>
    </div>
    <ul role="group">
      {array.map((item, index) => <li key={index}>{<Json json={item} />}</li>)}
    </ul>
    <div className={styles.array}>{']'}</div>
  </>
}

function CollapsedObject({ obj }: {obj: object}): ReactNode {
  const { elementRef, width } = useWidth<HTMLSpanElement>()
  const maxCharacterCount = Math.max(20, Math.floor(width / 8))
  const separator = ', '
  const kvSeparator = ': '

  const children: ReactNode[] = []
  let suffix: string | undefined = undefined

  const entries = Object.entries(obj)
  let characterCount = 0
  for (const [index, [key, value]] of entries.entries()) {
    if (index > 0) {
      characterCount += separator.length
      children.push(<span key={`separator-${index - 1}`}>{separator}</span>)
    }
    // should we continue?
    if (isPrimitive(value)) {
      const asString = typeof value === 'bigint' ? value.toString() :
        value === undefined ? 'undefined' /* see JsonContent - even if JSON.stringify([undefined]) === '[null]' */:
          JSON.stringify(value)
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

function JsonObject({ obj, label }: { obj: object, label?: string }): ReactNode {
  const [collapsed, setCollapsed] = useState(shouldObjectCollapse(obj))
  const key = label ? <span className={styles.key}>{label}: </span> : ''
  if (collapsed) {
    return <div role="treeitem" className={styles.clickable} aria-expanded="false" onClick={() => { setCollapsed(false) }}>
      {key}
      <CollapsedObject obj={obj}></CollapsedObject>
    </div>
  }
  return <>
    <div role="treeitem" className={styles.clickable} aria-expanded="true" onClick={() => { setCollapsed(true) }}>
      {key}
      <span className={styles.object}>{'{'}</span>
    </div>
    <ul role="group">
      {Object.entries(obj).map(([key, value]) =>
        <li key={key}>
          <Json json={value as unknown} label={key} />
        </li>
      )}
    </ul>
    <div className={styles.object}>{'}'}</div>
  </>
}
