import { Source } from '../lib/source.js'
import { BreadcrumbConfig } from './Breadcrumb.js'
import Cell from './Cell.js'
import File, { FileConfig } from './File.js'
import Folder from './Folder.js'

export type PageConfig = FileConfig & BreadcrumbConfig
export interface Navigation {
  col?: number
  row?: number
}

interface PageProps {
  source: Source,
  navigation?: Navigation,
  config?: PageConfig
}

export default function Page({ source, navigation, config }: PageProps) {
  if (source.kind === 'directory') {
    return <Folder source={source} config={config}/>
  }
  if (navigation?.row !== undefined && navigation.col !== undefined) {
    // cell view
    return <Cell source={source} row={navigation.row} col={navigation.col} config={config} />
  } else {
    // file view
    return <File source={source} config={config} />
  }
}
