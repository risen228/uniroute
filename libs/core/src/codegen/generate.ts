import {
  collectMetadataFromRemote,
  CollectMetadataFromRemoteOptions,
  collectMetadataFromSources,
  CollectMetadataFromSourcesOptions,
} from './collect-metadata'
import { GenerateOptionsSchema } from './contracts'
import {
  OutputInJSONOptions,
  OutputInTypescriptOptions,
  outputMetadataInJSON,
  outputMetadataInTypescript,
} from './output'
import { GenerateContext } from './types'

type SourcesInputOptions = CollectMetadataFromSourcesOptions & {
  type: 'sources'
}

type RemoteInputOptions = CollectMetadataFromRemoteOptions & {
  type: 'remote'
}

type TSOutputOptions = OutputInTypescriptOptions & {
  type: 'ts'
}

type JSONOutputOptions = OutputInJSONOptions & {
  type: 'json'
}

export type InputOptions = SourcesInputOptions | RemoteInputOptions
export type OutputOptions = TSOutputOptions | JSONOutputOptions

export interface GenerateOptions {
  input: InputOptions
  output: OutputOptions
  context?: Partial<GenerateContext>
}

export async function generate(rawOptions: GenerateOptions) {
  const options = GenerateOptionsSchema.parse(rawOptions)

  const metadata =
    options.input.type === 'sources'
      ? await collectMetadataFromSources(options.input, options.context)
      : await collectMetadataFromRemote(options.input)

  if (options.output.type === 'json') {
    await outputMetadataInJSON(metadata, options.output, options.context)
  } else {
    await outputMetadataInTypescript(metadata, options.output, options.context)
  }
}
