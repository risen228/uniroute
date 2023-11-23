import fs from 'node:fs'
import { dirname } from 'node:path'

export async function createDirectory(filePath: string) {
  const directoryPath = dirname(filePath)
  await fs.promises.mkdir(directoryPath, { recursive: true })
}
