import { ReactNode, useState } from 'react'
import styles from './Json.module.css'

interface JsonProps {
  json: unknown
  label?: string
}

/**
 * JSON viewer component with collapsible objects and arrays.
 */
export default function Json({ json, label }: JsonProps): ReactNode {
  return <div className={styles.json}><JsonContent json={json} label={label} /></div>
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
      div = <>{key}<span>{json.toString()}</span></>
    } else {
      div = <>{key}<span>{JSON.stringify(json)}</span></>
    }
  }
  return div
}

function isPrimitive(value: unknown): boolean {
  return (
    value !== undefined &&
    !Array.isArray(value) &&
    typeof value !== 'object' &&
    typeof value !== 'function'
  )
}

function InlineArray({ suffix, children }: {suffix?: string, children?: ReactNode}): ReactNode {
  return (
    <>
      <span className={styles.array}>{'['}</span>
      <span className={styles.array}>{children}</span>
      <span className={styles.array}>{']'}</span>
      {suffix && <span className={styles.comment}>{suffix}</span>}
    </>
  )
}

function CollapsedArray({ array }: {array: unknown[]}): ReactNode {
  const maxCharacterCount = 40
  const separator = ', '

  const children: ReactNode[] = []
  let suffix: string | undefined = undefined

  let characterCount = 0
  for (const [index, item] of array.entries()) {
    if (index > 0) {
      characterCount += separator.length
      children.push(<span key={`separator-${index - 1}`}>, </span>)
    }
    // should we continue?
    if (isPrimitive(item)) {
      const asString = typeof item === 'bigint' ? item.toString() : JSON.stringify(item)
      characterCount += asString.length
      if (characterCount < maxCharacterCount) {
        children.push(<JsonContent json={item} key={`item-${index}`} />)
        continue
      }
    }
    // no: it was the last entry
    children.push(<span key="rest">...</span>)
    suffix = ` length: ${array.length}`
    break
  }
  return <InlineArray suffix={suffix}>{children}</InlineArray>
}

function JsonArray({ array, label }: { array: unknown[], label?: string }): ReactNode {
  const [collapsed, setCollapsed] = useState(true)
  const key = label ? <span className={styles.key}>{label}: </span> : ''
  if (collapsed) {
    return <div className={styles.clickable} onClick={() => { setCollapsed(false) }}>
      <span className={styles.drill}>{'\u25B6'}</span>
      {key}
      <CollapsedArray array={array}></CollapsedArray>
    </div>
  }
  return <>
    <div className={styles.clickable} onClick={() => { setCollapsed(true) }}>
      <span className={styles.drill}>{'\u25BC'}</span>
      {key}
      <span className={styles.array}>{'['}</span>
    </div>
    <ul>
      {array.map((item, index) => <li key={index}>{<Json json={item} />}</li>)}
    </ul>
    <div className={styles.array}>{']'}</div>
  </>
}

function JsonObject({ obj, label }: { obj: object, label?: string }): ReactNode {
  const [collapsed, setCollapsed] = useState(false)
  const key = label ? <span className={styles.key}>{label}: </span> : ''
  if (collapsed) {
    return <div className={styles.clickable} onClick={() => { setCollapsed(false) }}>
      <span className={styles.drill}>{'\u25B6'}</span>
      {key}
      <span className={styles.object}>{'{...}'}</span>
    </div>
  }
  return <>
    <div className={styles.clickable} onClick={() => { setCollapsed(true) }}>
      <span className={styles.drill}>{'\u25BC'}</span>
      {key}
      <span className={styles.object}>{'{'}</span>
    </div>
    <ul>
      {Object.entries(obj).map(([key, value]) =>
        <li key={key}>
          <Json json={value as unknown} label={key} />
        </li>
      )}
    </ul>
    <div className={styles.object}>{'}'}</div>
  </>
}
