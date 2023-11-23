import { ZodIssue } from 'zod'

export class RouteException<T = void> extends Error {
  $uniroute = 'exception'

  status = 400
  name = 'RouteException'
  payload: T

  constructor(payload: T) {
    super('Route Exception')
    this.payload = payload
  }
}

export class InternalError extends RouteException {
  status = 500
  name = 'InternalError'

  constructor(message?: string) {
    super()
    this.message = message ?? 'Internal Error'
  }
}

export interface ValidationExceptionPayload {
  issues: ZodIssue[]
}

export class ValidationException extends RouteException<ValidationExceptionPayload> {
  status = 400
  name = 'ValidationException'

  constructor({ issues }: ValidationExceptionPayload) {
    super({ issues })
  }
}
