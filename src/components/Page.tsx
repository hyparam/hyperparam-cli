import { Source } from '../lib/sources/types.js'
import Cell from './Cell.js'
import File from './File.js'
import Folder from './Folder.js'

export interface Navigation {
  col?: number
  row?: number
}

interface PageProps {
  source: Source,
  navigation?: Navigation,
}

export default function Page({ source, navigation }: PageProps) {
  if (source.kind === 'directory') {
    return <Folder source={source} />
  }
  if (navigation?.row !== undefined && navigation.col !== undefined) {
    // cell view
    return <Cell source={source} row={navigation.row} col={navigation.col} />
  } else {
    // file view
    return <File source={source} />
  }
}
