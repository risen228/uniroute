import { IncomingMessage, ServerResponse } from 'node:http'

export type RouteMethod =
  | 'GET'
  | 'POST'
  | 'PUT'
  | 'DELETE'
  | 'PATCH'
  | 'TRACE'
  | 'HEAD'
  | 'OPTIONS'

export interface Validation<TPayload, TTransformed = TPayload> {
  fn: (payload: unknown) => Promise<TTransformed>
}

export interface Route<
  TPayload = void,
  TTransformed = TPayload,
  TOutput = void,
  TMethod extends RouteMethod = RouteMethod,
  TPath extends string | void = void,
> {
  $uniroute: 'route'
  path?: TPath
  method: TMethod
  validation?: {
    payload?: Validation<TPayload, TTransformed>
  }
  handler: RouteHandler<TTransformed, TOutput>
}

export interface RouteOutput<TOutput = void> {
  $uniroute: 'output'
  data?: TOutput
  statusCode: number
  headers?: Record<string, string>
}

export type RouteHandler<TTransformed = void, TOutput = void> = (params: {
  payload: TTransformed
  req: IncomingMessage
  res: ServerResponse
}) => RouteOutput<TOutput> | Promise<RouteOutput<TOutput>>
