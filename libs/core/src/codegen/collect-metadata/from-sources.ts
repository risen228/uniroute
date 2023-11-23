import path from 'node:path'
import { Node, Project, Symbol as TSSymbol, Type, TypeChecker } from 'ts-morph'
import { RouteMethod } from '../../types'
import { footprintType } from '../lib/footprint-type'
import { CollectedRoute, GenerateContext, Import } from '../types'

function normalizePath(dirty: string) {
  let path = dirty
  if (path.startsWith('/')) path = path.slice(1)
  if (path.endsWith('/')) path = path.slice(0, -1)
  return path
}

function createPath(params: {
  name: string
  customPath?: string
  parentPath: string[]
}) {
  const { name, customPath, parentPath } = params
  const generatedPath = parentPath.concat(name).join('_')
  return customPath ? normalizePath(customPath) : generatedPath
}

interface Context {
  routesNode: Node
  checker: TypeChecker
  externals: string[]
  collectedRoutes: CollectedRoute[]
  next: (segment: string, type: Type) => void
}

export interface CollectMetadataFromSourcesOptions {
  tsConfigFilePath: string
  sourceFilePath: string
  routesVariable: string
  externals?: string[]
}

export async function collectMetadataFromSources(
  options: CollectMetadataFromSourcesOptions,
  context: GenerateContext,
) {
  const { routesVariable, externals = [] } = options

  const tsConfigFilePath = path.resolve(context.cwd, options.tsConfigFilePath)
  const sourceFilePath = path.resolve(context.cwd, options.sourceFilePath)

  const project = new Project({ tsConfigFilePath })
  const checker = project.getTypeChecker()
  const sourceFile = project.getSourceFileOrThrow(sourceFilePath)

  const routesNode = sourceFile.getVariableDeclarationOrThrow(routesVariable)
  const routesType = routesNode.getType()

  return extractMetadataFromType({
    routesType,
    routesNode,
    checker,
    externals,
  })
}

function extractMetadataFromType(options: {
  routesType: Type
  routesNode: Node
  checker: TypeChecker
  externals: string[]
  parentPath?: string[]
  collectedRoutes?: CollectedRoute[]
}) {
  const {
    routesType,
    routesNode,
    checker,
    externals,
    parentPath = [],
    collectedRoutes = [],
  } = options

  const next = (segment: string, nextType: Type) => {
    extractMetadataFromType({
      routesType: nextType,
      routesNode,
      checker,
      externals,
      parentPath: parentPath.concat(segment),
      collectedRoutes,
    })
  }

  const context: Context = {
    routesNode,
    checker,
    externals,
    next,
    collectedRoutes,
  }

  if (routesType.isObject()) {
    const props = routesType.getProperties()
    properties(props, parentPath, context)
  }

  return collectedRoutes
}

function properties(props: TSSymbol[], parentPath: string[], context: Context) {
  return props.map((value) => property(value, parentPath, context))
}

function property(prop: TSSymbol, parentPath: string[], context: Context) {
  const type = prop.getTypeAtLocation(context.routesNode)

  if (type.getSymbol()?.getName() === 'Route') {
    const genericArguments = context.checker.getTypeArguments(type)

    const payloadArgument = genericArguments[0]
    const outputArgument = genericArguments[2]
    const methodArgument = genericArguments[3]
    const pathArgument = genericArguments[4]

    if (!methodArgument.isStringLiteral()) {
      throw new Error('Method argument must be a string literal')
    }

    if (!pathArgument.isStringLiteral() && !pathArgument.isVoid()) {
      throw new Error('Path argument must be void or a string literal')
    }

    const method = methodArgument.getLiteralValue() as RouteMethod

    const imports: Import[] = []

    const payloadType = footprintType({
      type: payloadArgument,
      node: context.routesNode,
      externals: context.externals,
      imports,
    })

    const outputType = footprintType({
      type: outputArgument,
      node: context.routesNode,
      externals: context.externals,
      imports,
    })

    const customPath = pathArgument.isStringLiteral()
      ? (pathArgument.getLiteralValue() as string)
      : undefined

    context.collectedRoutes.push({
      parentPath,
      name: prop.getEscapedName(),
      path: createPath({
        name: prop.getEscapedName(),
        customPath,
        parentPath,
      }),
      method,
      imports,
      payloadType,
      outputType,
    })
  }

  return context.next(prop.getName(), type)
}
