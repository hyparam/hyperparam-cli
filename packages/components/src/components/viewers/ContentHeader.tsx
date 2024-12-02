import { ReactNode } from 'react'
import { formatFileSize } from '../../lib/utils.js'

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
      {content?.fileSize && <span title={content.fileSize.toLocaleString('en-US') + ' bytes'}>
        {formatFileSize(content.fileSize)}
      </span>}
      {headers}
    </div>
    {children}
  </div>
}
