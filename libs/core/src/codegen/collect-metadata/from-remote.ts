import { MetadataSchema } from '../contracts'
import { CollectedRoute } from '../types'

export interface CollectMetadataFromRemoteOptions {
  url: string
}

export async function collectMetadataFromRemote(
  options: CollectMetadataFromRemoteOptions,
): Promise<CollectedRoute[]> {
  const response = await fetch(options.url)

  try {
    const metadata = await response.json()
    return MetadataSchema.parse(metadata)
  } catch (error) {
    console.error(`Failed to parse metadata from ${options.url}`)
    throw error
  }
}
