import * as monaco from 'monaco-editor'
// @ts-expect-error monaco vite
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
// @ts-expect-error monaco vite
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
// @ts-expect-error monaco vite
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
// @ts-expect-error monaco vite
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
// @ts-expect-error monaco vite
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import React, { useEffect, useRef } from 'react'

interface EditorProps {
  options?: monaco.editor.IStandaloneEditorConstructionOptions
  value: string | undefined
}

self.MonacoEnvironment = {
  getWorker: function (workerId, label) {
    if (label === 'json') {
      return jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return tsWorker()
    }
    return editorWorker()
  },
}

export default function Editor({ value, options }: EditorProps) {
  const div = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (div.current && !editorRef.current) {
      editorRef.current = monaco.editor.create(div.current, { value, ...options })
    }
  }, [div.current, editorRef.current, options])

  useEffect(() => {
    editorRef.current?.setValue(value || '')
  }, [value])

  return <div style={{ flex: 1 }} ref={div}></div>
}
