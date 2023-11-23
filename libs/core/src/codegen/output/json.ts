import fs from 'node:fs'
import path from 'node:path'
import { createDirectory } from '../lib/create-directory'
import { CollectedRoute, GenerateContext } from '../types'

export interface OutputInJSONOptions {
  targetFilePath: string
  minify?: boolean
}

export async function outputMetadataInJSON(
  metadata: CollectedRoute[],
  options: OutputInJSONOptions,
  context: GenerateContext,
) {
  const { minify = false } = options
  const targetFilePath = path.resolve(context.cwd, options.targetFilePath)

  await createDirectory(targetFilePath)

  const json = minify
    ? JSON.stringify(metadata)
    : JSON.stringify(metadata, null, 2)

  await fs.promises.writeFile(targetFilePath, json)
}
