import { ReactNode, useState } from 'react'
import styles from '../styles/Json.module.css'

interface JsonProps {
  json: unknown
  label?: string
}

/**
 * JSON viewer component with collapsible objects and arrays.
 */
export default function Json({ json, label }: JsonProps): ReactNode {
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
  return <div className={styles.json}>{div}</div>
}

function JsonArray({ array, label }: { array: unknown[], label?: string }): ReactNode {
  const [collapsed, setCollapsed] = useState(false)
  const key = label ? <span className={styles.key}>{label}: </span> : ''
  if (collapsed) {
    return <div className={styles.clickable} onClick={() => { setCollapsed(false) }}>
      <span className={styles.drill}>{'\u25B6'}</span>
      {key}
      <span className={styles.array}>{'[...]'}</span>
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
      {Object.entries(obj).map(([key, value]) => (
        <li key={key}>
          <Json json={value as unknown} label={key} />
        </li>
      ))}
    </ul>
    <div className={styles.object}>{'}'}</div>
  </>
}
