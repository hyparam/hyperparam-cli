import React, { ReactNode } from 'react'
import { getFileSize } from '../../files.js'

export interface ContentSize {
  fileSize?: number
}

export interface TextContent extends ContentSize {
  text: string
}

interface ContentHeaderProps {
  content?: ContentSize
  headers?: ReactNode
  children?: ReactNode
}

export default function ContentHeader({ content, headers, children }: ContentHeaderProps) {
  return <div className='viewer'>
    <div className='view-header'>
      <span title={content?.fileSize?.toLocaleString() + ' bytes'}>
        {getFileSize(content)}
      </span>
      {headers}
    </div>
    {children}
  </div>
}

/**
 * Parse the content-length header from a fetch response.
 */
export function parseFileSize(headers: Headers): number | undefined {
  const contentLength = headers.get('content-length')
  return contentLength ? Number(contentLength) : undefined
}
