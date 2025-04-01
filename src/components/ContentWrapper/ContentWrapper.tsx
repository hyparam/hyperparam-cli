import { ReactNode } from 'react'
import { useConfig } from '../../hooks/useConfig.js'
import { cn, formatFileSize } from '../../lib/utils.js'
import Center from '../Center/Center.js'
import Spinner from '../Spinner/Spinner.js'
import styles from './ContentWrapper.module.css'

export interface ContentSize {
  fileSize?: number
}

export interface TextContent extends ContentSize {
  text: string
}

interface ContentWrapperProps {
  content?: ContentSize
  headers?: ReactNode
  isLoading?: boolean
  children?: ReactNode
}

export default function ContentWrapper({ content, headers, isLoading, children }: ContentWrapperProps) {
  const { customClass } = useConfig()
  return <div className={cn(styles.contentWrapper, customClass?.contentWrapper)}>
    <header>
      {content?.fileSize && <span title={content.fileSize.toLocaleString('en-US') + ' bytes'}>
        {formatFileSize(content.fileSize)}
      </span>}
      {headers}
    </header>
    {isLoading ? <Center><Spinner /></Center> : children }
  </div>
}
