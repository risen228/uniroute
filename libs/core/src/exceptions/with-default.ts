import * as defaultExceptions from './default'
import { RouteException } from './default'

export function withDefaultExceptions(
  exceptions: Record<string, new (...args: any[]) => RouteException>,
) {
  return { ...defaultExceptions, ...exceptions }
}
