import { Route, RouteMethod } from '../../types'
import { RouteOptions } from './types'

export function createRoute<
  TPayload = void,
  TTransformed = TPayload,
  TOutput = void,
  TMethod extends RouteMethod = RouteMethod,
  TPath extends string | void = void,
>({
  path,
  method,
  validation,
  handler,
}: RouteOptions<TPayload, TTransformed, TOutput, TMethod, TPath>): Route<
  TPayload,
  TTransformed,
  TOutput,
  TMethod,
  TPath
> {
  const route: Route<TPayload, TTransformed, TOutput, TMethod, TPath> = {
    $uniroute: 'route',
    method,
    validation,
    async handler({ payload, ...context }) {
      const finalPayload = validation?.payload
        ? await validation.payload.fn(payload)
        : (null as TTransformed)

      return handler({ ...context, payload: finalPayload })
    },
  }

  if (path) {
    route.path = normalizePath(path) as TPath
  }

  return route
}

function normalizePath(dirty: string) {
  let path = dirty
  if (path.startsWith('/')) path = path.slice(1)
  if (path.endsWith('/')) path = path.slice(0, -1)
  return path
}
