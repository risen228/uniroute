import { RouteException } from '../exceptions'
import { SerializedException } from '../exceptions/types'
import { Tree, trees } from '../lib'
import { BrokenResponseError, FetchError, ServerException } from './errors'
import { Client, ClientMetadata, PossibleError } from './types'

type JsonResult<T = unknown> = { data: T } | { error: string }

async function toJson<T = unknown>(response: Response): Promise<JsonResult<T>> {
  const isJson = response.headers
    .get('Content-Type')
    ?.includes('application/json')

  if (!isJson) {
    return { error: `Response Content-Type is not application/json` }
  }

  try {
    return { data: await response.json() }
  } catch {
    return { error: `Failed to parse response body - invalid JSON` }
  }
}

async function normalizeError(error: unknown): Promise<PossibleError> {
  if (error instanceof FetchError) {
    return error
  }

  if (error instanceof ServerException) {
    const json = await toJson<SerializedException>(error.response)
    if ('error' in json) return new BrokenResponseError(json.error)
    const { payload, ...restProps } = json.data
    const exception = new RouteException<unknown>(payload)
    Object.assign(exception, restProps)
    return exception
  }

  if (error instanceof BrokenResponseError) {
    return error
  }

  return new BrokenResponseError('Unknown error')
}

export function createClient<
  TClientTree extends object,
  TErrorOutput = void,
>(options: {
  basePath?: string
  metadata: ClientMetadata<TClientTree>
  transformError: (error: PossibleError) => TErrorOutput
}): Client<TClientTree, TErrorOutput> {
  const { basePath = '', metadata, transformError } = options

  type Handler = (payload: unknown) => Promise<unknown>
  const client: Tree<Handler> = {}

  for (const { parentPath, name, path, method } of metadata) {
    const handler: Handler = async (payload) => {
      try {
        let url = `${basePath}/${path}`

        const init: RequestInit = {
          method,
          credentials: 'include',
        }

        if (method === 'GET' && payload) {
          const query = new URLSearchParams(payload as Record<string, string>)
          if (query.size > 0) url += `?${query}`
        }

        if (method !== 'GET' && payload) {
          init.body = JSON.stringify(payload)
          init.headers = { 'Content-Type': 'application/json' }
        }

        const response = await fetch(url, init)
        if (!response.ok) throw new ServerException(response)

        const json = await toJson(response)
        if ('error' in json) throw new BrokenResponseError(json.error)
        return json.data
      } catch (error) {
        const normalized = await normalizeError(error)
        return transformError(normalized)
      }
    }

    trees.set(client, parentPath.concat(name), handler)
  }

  return client as Client<TClientTree, TErrorOutput>
}
