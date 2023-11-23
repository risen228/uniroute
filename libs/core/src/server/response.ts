import { RouteOutput } from '../types'

export function StatusCode(statusCode: number): RouteOutput {
  return {
    $uniroute: 'output',
    statusCode,
  }
}

export function Json<TOutput = void>(
  statusCode: number,
  data: TOutput,
): RouteOutput<TOutput> {
  return {
    $uniroute: 'output',
    data,
    statusCode,
    headers: { 'Content-Type': 'application/json' },
  }
}

export function Redirect(status: 301 | 302, url: string): RouteOutput {
  return {
    $uniroute: 'output',
    statusCode: status,
    headers: { Location: url },
  }
}
