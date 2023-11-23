import { pascalCase } from 'change-case'
import path from 'node:path'
import { Project, TypeLiteralNode } from 'ts-morph'
import { createDirectory } from '../lib/create-directory'
import { CollectedRoute, GenerateContext, Import } from '../types'

interface GroupedImport {
  packageName: string
  exportNames: string[]
}

function groupImports(imports: Import[]): GroupedImport[] {
  const exportsByPackage = new Map<string, Set<string>>()

  for (const { packageName, exportName } of imports) {
    const exportsSet = exportsByPackage.get(packageName) ?? new Set()
    exportsSet.add(exportName)
    exportsByPackage.set(packageName, exportsSet)
  }

  const grouped: GroupedImport[] = []

  for (const [packageName, exportsSet] of exportsByPackage.entries()) {
    grouped.push({ packageName, exportNames: Array.from(exportsSet) })
  }

  return grouped
}

function generateTypeNames(route: CollectedRoute) {
  const fullName = route.parentPath.concat(route.name).join('_')

  return {
    payloadTypeName: pascalCase(fullName) + 'Payload',
    outputTypeName: pascalCase(fullName) + 'Output',
  }
}

function createType(params: { name: string; body: string }) {
  const { name, body } = params

  if (body === 'void') {
    return null
  }

  return body.startsWith('{')
    ? `export interface ${name} ${body}`
    : `export type ${name} = ${body}`
}

function createTypeMention(params: { name: string; body: string }) {
  const { name, body } = params
  return body === 'void' ? 'void' : name
}

export interface OutputInTypescriptOptions {
  tsConfigFilePath: string
  targetFilePath: string
}

export async function outputMetadataInTypescript(
  metadata: CollectedRoute[],
  options: OutputInTypescriptOptions,
  context: GenerateContext,
) {
  const tsConfigFilePath = path.resolve(context.cwd, options.tsConfigFilePath)
  const targetFilePath = path.resolve(context.cwd, options.targetFilePath)

  await createDirectory(targetFilePath)

  const project = new Project({ tsConfigFilePath })

  const targetFile = project.createSourceFile(targetFilePath, '', {
    overwrite: true,
  })

  const groupedImports = groupImports(
    metadata.reduce<Import[]>((acc, route) => {
      return acc.concat(route.imports)
    }, []),
  )

  targetFile.addImportDeclaration({
    moduleSpecifier: '@uniroute/core/client',
    namedImports: ['ClientMetadata'],
    isTypeOnly: true,
  })

  for (const { packageName, exportNames } of groupedImports) {
    targetFile.addImportDeclaration({
      moduleSpecifier: packageName,
      namedImports: exportNames,
      isTypeOnly: true,
    })
  }

  const types: string[] = []

  for (const route of metadata) {
    const { payloadTypeName, outputTypeName } = generateTypeNames(route)

    const payloadType = createType({
      name: payloadTypeName,
      body: route.payloadType,
    })

    const outputType = createType({
      name: outputTypeName,
      body: route.outputType,
    })

    if (payloadType) types.push(payloadType)
    if (outputType) types.push(outputType)
  }

  targetFile.insertText(targetFile.getEnd(), '\n' + types.join('\n\n'))

  const clientTree = targetFile.addInterface({
    name: 'ClientTree',
    isExported: true,
  })

  for (const route of metadata) {
    let targetLiteral: TypeLiteralNode | null = null

    for (const propName of route.parentPath) {
      const parentType = targetLiteral ?? clientTree

      const property =
        parentType.getProperty(propName) ??
        clientTree.addProperty({
          name: propName,
          type: '{}',
        })

      targetLiteral = property.getTypeNode() as TypeLiteralNode
    }

    const { payloadTypeName, outputTypeName } = generateTypeNames(route)
    const parentType = targetLiteral ?? clientTree

    const routeProperty = parentType.addProperty({
      name: route.name,
      type: '{}',
    })

    const routeLiteral = routeProperty.getTypeNode() as TypeLiteralNode

    const payloadTypeMention = createTypeMention({
      name: payloadTypeName,
      body: route.payloadType,
    })

    const outputTypeMention = createTypeMention({
      name: outputTypeName,
      body: route.outputType,
    })

    routeLiteral.addProperty({ name: 'payload', type: payloadTypeMention })
    routeLiteral.addProperty({ name: 'output', type: outputTypeMention })
  }

  const cleanMetadata = metadata.map((route) => {
    const { imports, payloadType, outputType, ...clean } = route
    return { $uniroute: 'metadata', ...clean }
  })

  const metadataJson = JSON.stringify(cleanMetadata, null, 2)

  targetFile.insertText(
    targetFile.getEnd(),
    `\nexport const metadata: ClientMetadata<ClientTree> = ${metadataJson}`,
  )

  targetFile.formatText({
    ensureNewLineAtEndOfFile: true,
    semicolons: 'remove' as any,
    convertTabsToSpaces: true,
    indentSize: 2,
  })

  await targetFile.save()
}
