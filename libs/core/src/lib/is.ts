import { RouteMetadata } from '../codegen/types'
import { SerializedException } from '../exceptions/types'
import { Route } from '../types'

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function route(value: unknown): value is Route<unknown, unknown> {
  return object(value) && value.$uniroute === 'route'
}

function metadata(value: unknown): value is RouteMetadata {
  return object(value) && value.$uniroute === 'metadata'
}

function serializedException(value: unknown): value is SerializedException {
  return object(value) && value.$uniroute === 'exception'
}

export const is = {
  object,
  route,
  metadata,
  serializedException,
}
