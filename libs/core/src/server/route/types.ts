import { IncomingMessage, ServerResponse } from 'node:http'
import { RouteHandler, RouteMethod, Validation } from '../../types'

export interface RouteContext {
  req: IncomingMessage
  res: ServerResponse
}

export interface RouteOptions<
  TPayload = void,
  TTransformed = TPayload,
  TOutput = void,
  TMethod extends RouteMethod = RouteMethod,
  TPath extends string | void = void,
> {
  path?: TPath
  method: TMethod
  validation?: {
    payload?: Validation<TPayload, TTransformed>
  }
  handler: RouteHandler<TTransformed, TOutput>
}
