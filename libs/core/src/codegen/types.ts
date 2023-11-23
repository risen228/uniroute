import { RouteMethod } from '../types'

export interface RouteMetadata {
  $uniroute: 'metadata'
  parentPath: string[]
  name: string
  path?: string
  method: RouteMethod
}

export interface Import {
  packageName: string
  exportName: string
}

export interface CollectedRoute {
  parentPath: string[]
  name: string
  path?: string
  method: RouteMethod

  imports: Import[]
  payloadType: string
  outputType: string
}

export interface GenerateContext {
  cwd: string
}
