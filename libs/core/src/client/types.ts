import { RouteMetadata } from '../codegen/types'
import { RouteException } from '../exceptions'
import type { BrokenResponseError, FetchError } from './errors'

export type PossibleError =
  | FetchError
  | BrokenResponseError
  | RouteException<unknown>

export type Client<TRouteTree, TErrorOutput> = {
  [TKey in keyof TRouteTree]: TRouteTree[TKey] extends ClientTreeEntry<
    infer TPayload,
    infer TOutput
  >
    ? (
        payload: TPayload,
      ) => void extends TErrorOutput
        ? Promise<TOutput>
        : Promise<TOutput | TErrorOutput>
    : Client<TRouteTree[TKey], TErrorOutput>
}

export interface ClientTreeEntry<TPayload = unknown, TOutput = unknown> {
  payload: TPayload
  output: TOutput
}

// TClientTree is only used for type inference
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export type ClientMetadata<TClientTree extends object> = RouteMetadata[]
