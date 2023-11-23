import * as fs from 'node:fs'
import {
  Node,
  Signature,
  Symbol as TSSymbol,
  SymbolFlags,
  Type,
  TypeFormatFlags,
} from 'ts-morph'
import { Import } from '../types'

function isPrimitive(type: Type) {
  return (
    type.isString() ||
    type.isStringLiteral() ||
    type.isNumber() ||
    type.isNumberLiteral() ||
    type.isBoolean() ||
    type.isBooleanLiteral() ||
    type.isNull() ||
    type.isUndefined() ||
    type.isAny() ||
    type.isUnknown() ||
    type.isVoid() ||
    type.isNever()
  )
}

function isPromise(type: Type) {
  const symbol = type.getSymbol()
  if (!type.isObject() || !symbol) {
    return false
  }
  const args = type.getTypeArguments()
  return symbol.getName() === 'Promise' && args.length === 1
}

function isSimpleSignature(type: Type) {
  if (!type.isObject()) {
    return false
  }
  const sigs = type.getCallSignatures()
  const props = type.getProperties()
  const args = type.getTypeArguments()
  const indexType = type.getNumberIndexType()
  const stringType = type.getStringIndexType()
  return (
    sigs.length === 1 &&
    props.length === 0 &&
    args.length === 0 &&
    !indexType &&
    !stringType
  )
}

interface PackageJson {
  name: string
}

function findNearestPackageJson(path: string): PackageJson | null {
  const segments = path.split('/')

  const packageJsonPath = segments
    .map((_, index) => {
      const path = segments.slice(0, -index).join('/')
      return `${path}/package.json`
    })
    .find((path) => fs.existsSync(path))

  if (!packageJsonPath) {
    return null
  }

  return JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
}

interface Context {
  node: Node
  next: (type: Type) => string
  imports: Import[]
  externals: string[]
}

export function footprintType(options: {
  type: Type
  node: Node
  externals: string[]
  imports?: Import[]
  callStackLevel?: number
}): string {
  const { type, node, externals, imports = [], callStackLevel = 0 } = options

  if (callStackLevel > 9) {
    // too deep
    return 'any'
  }

  const symbol = type.getSymbol() ?? type.getAliasSymbol()
  const declarations = symbol?.getDeclarations() ?? []

  if (declarations.length > 0) {
    let externalImportFound = false

    for (const declaration of declarations) {
      const sourceFile = declaration.getSourceFile()
      const sourceFilePath = sourceFile.getFilePath()
      const packageJson = findNearestPackageJson(sourceFilePath)
      const name = declaration.getSymbolOrThrow().getName()

      if (packageJson && externals.includes(packageJson.name)) {
        imports.push({
          packageName: packageJson.name,
          exportName: name,
        })

        if (name === symbol?.getEscapedName()) {
          externalImportFound = true
        }
      }
    }

    if (externalImportFound) {
      return symbol?.getEscapedName() ?? 'TODO'
    }
  }

  const next = (nextType: Type) => {
    return footprintType({
      type: nextType,
      node,
      imports,
      externals,
      callStackLevel: callStackLevel + 1,
    })
  }

  const context: Context = {
    node,
    next,
    imports,
    externals,
  }

  const indent = (text: string, lvl = 1) =>
    text.replace(/^/gm, ' '.repeat(lvl * 2))

  if (isPrimitive(type)) {
    return type.getText(
      node,
      TypeFormatFlags.UseSingleQuotesForStringLiteralType,
    )
  }

  if (type.isArray()) {
    const subType = type.getArrayElementTypeOrThrow()

    if (isPrimitive(subType)) {
      return `${next(subType)}[]`
    }

    return `Array<\n${indent(next(subType))}\n>`
  }

  if (type.isTuple()) {
    const types = type.getTupleElements()

    return [
      '[\n',
      indent(types.map((type) => next(type)).join(',\n')),
      '\n]',
    ].join('')
  }

  if (type.isObject() && isPromise(type)) {
    const args = type.getTypeArguments()

    if (args.length === 0) {
      throw new Error('This should not have happened')
    }

    const first = args[0]

    if (isPrimitive(first)) {
      return `Promise<${next(first)}>`
    }

    return `Promise<\n${indent(next(first))}\n>`
  }

  if (type.isObject() && isSimpleSignature(type)) {
    return signatures(type.getCallSignatures(), 'type', context)
  }

  if (type.isObject()) {
    const props = type.getProperties()
    const sigs = type.getCallSignatures()
    const numIndex = type.getNumberIndexType()
    const stringIndex = type.getStringIndexType()

    if (props.length === 0 && sigs.length === 0 && !numIndex && !stringIndex) {
      return '{}'
    }

    const sigsText = signatures(sigs, 'declaration', context)
    const propsText = properties(props, context)

    const numIndexText = numIndex && `[index: number]: ${next(numIndex)};`
    const stringIndexText =
      stringIndex && `[index: string]: ${next(stringIndex)};`

    return [
      '{\n',
      numIndexText && indent(numIndexText),
      stringIndexText && indent(stringIndexText),
      sigs.length > 0 && indent(sigsText),
      props.length > 0 && indent(propsText),
      '\n}',
    ]
      .filter(Boolean)
      .join('')
  }

  if (type.isUnion()) {
    return type
      .getUnionTypes()
      .map((type) => next(type))
      .join(' | ')
  }

  if (type.isIntersection()) {
    return type
      .getIntersectionTypes()
      .map((type) => next(type))
      .join(' & ')
  }

  return 'TODO'
}

function properties(props: TSSymbol[], context: Context) {
  return props.map((value) => property(value, context)).join('\n')
}

function property(prop: TSSymbol, context: Context): string {
  const type = prop.getTypeAtLocation(context.node)
  const signatures = type.getCallSignatures()

  const symbol = type.getSymbol() ?? type.getAliasSymbol()
  const declarations = symbol?.getDeclarations() ?? []

  if (declarations.length > 0) {
    let externalImportFound = false

    for (const declaration of declarations) {
      const sourceFile = declaration.getSourceFile()
      const sourceFilePath = sourceFile.getFilePath()
      const packageJson = findNearestPackageJson(sourceFilePath)
      const name = declaration.getSymbolOrThrow().getName()

      if (packageJson && context.externals.includes(packageJson.name)) {
        context.imports.push({
          packageName: packageJson.name,
          exportName: name,
        })

        if (name === symbol?.getEscapedName()) {
          externalImportFound = true
        }
      }
    }

    const isOptional = prop.hasFlags(SymbolFlags.Optional)

    if (externalImportFound) {
      return [
        prop.getName(),
        isOptional ? '?' : '',
        ': ',
        symbol?.getEscapedName() ?? 'TODO',
        ';',
      ].join('')
    }
  }

  if (
    isSimpleSignature(type) &&
    !prop.hasFlags(SymbolFlags.Optional) &&
    signatures.length > 0
  ) {
    return (
      signature(signatures[0], 'declaration', context, prop.getName()) + ';'
    )
  }

  const isOptional = prop.hasFlags(SymbolFlags.Optional)

  return [
    prop.getName(),
    isOptional ? '?' : '',
    ': ',
    context.next(type),
    ';',
  ].join('')
}

function signatures(
  sigs: Signature[],
  variant: 'type' | 'declaration',
  context: Context,
) {
  return sigs.map((sig) => signature(sig, variant, context)).join('\n')
}

function signature(
  sig: Signature,
  variant: 'type' | 'declaration',
  context: Context,
  methodName?: string,
): string {
  const name = sig.getDeclaration().getSymbol()?.getName()
  const nameToUse =
    methodName ?? (['__type', '__call'].includes(name ?? '') ? '' : name)
  const params = sig.getParameters()
  return [
    variant === 'declaration' ? nameToUse : '',
    '(',
    params
      .map((param) =>
        [
          param.getName(),
          param.hasFlags(SymbolFlags.Optional) ? '?' : '',
          ': ',
          param
            .getDeclarations()
            .map((decl) => context.next(decl.getType()))
            .join(','),
        ].join(''),
      )
      .join(', '),
    ')',
    variant === 'declaration' ? ': ' : ' => ',
    context.next(sig.getReturnType()),
  ].join('')
}
