import fsExtra from 'fs-extra'

export function emptyDirectory(path: string) {
  fsExtra.emptyDirSync(path)
}
