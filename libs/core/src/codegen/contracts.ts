import { z } from 'zod'
import { RouteMethodSchema } from '../contracts'

export const ImportSchema = z.object({
  packageName: z.string(),
  exportName: z.string(),
})

export const CollectedRouteSchema = z.object({
  parentPath: z.array(z.string()),
  name: z.string(),
  path: z.string().optional(),
  method: RouteMethodSchema,
  imports: z.array(ImportSchema),
  payloadType: z.string(),
  outputType: z.string(),
})

export const MetadataSchema = z.array(CollectedRouteSchema)

const SourcesInputSchema = z.object({
  type: z.literal('sources'),
  tsConfigFilePath: z.string(),
  sourceFilePath: z.string(),
  routesVariable: z.string(),
  externals: z.array(z.string()),
})

const RemoteInputSchema = z.object({
  type: z.literal('remote'),
  url: z.string(),
})

const InputSchema = z.discriminatedUnion('type', [
  SourcesInputSchema,
  RemoteInputSchema,
])

const JSONOutputSchema = z.object({
  type: z.literal('json'),
  targetFilePath: z.string(),
})

const TSOutputSchema = z.object({
  type: z.literal('ts'),
  tsConfigFilePath: z.string(),
  targetFilePath: z.string(),
})

const OutputSchema = z.discriminatedUnion('type', [
  JSONOutputSchema,
  TSOutputSchema,
])

export const GenerateContextSchema = z.object({
  cwd: z.string().default(process.cwd()),
})

export const GenerateOptionsSchema = z.object({
  input: InputSchema,
  output: OutputSchema,
  context: GenerateContextSchema.default({}),
})
