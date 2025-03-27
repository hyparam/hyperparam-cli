import { ReactNode } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { cn, formatFileSize } from '../../lib/utils.js'
import styles from '../../styles/viewers/ContentHeader.module.css'

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
  const { customClass } = useConfig()
  return <div className={cn(styles.contentWrapper, customClass?.contentWrapper)}>
    <header>
      {content?.fileSize && <span title={content.fileSize.toLocaleString('en-US') + ' bytes'}>
        {formatFileSize(content.fileSize)}
      </span>}
      {headers}
    </header>
    {children}
  </div>
}
