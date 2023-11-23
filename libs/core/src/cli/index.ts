import fs from 'fs/promises'
import path from 'path'
import { generate, GenerateOptions } from '@uniroute/core/codegen'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import { z, ZodError } from 'zod'
import { GenerateOptionsSchema } from '../codegen/contracts'

const ConfigOptionsSchema = z.object({
  config: z.string(),
})

const OptionsSchema = z.union([ConfigOptionsSchema, GenerateOptionsSchema])

yargs(hideBin(process.argv))
  .command({
    command: 'generate',
    describe: 'Generate Uniroutes metadata',
    builder: (yargs) => {
      return yargs
        .option('config', {
          alias: 'c',
          type: 'string',
          description: 'A path to the config file',
          group: 'Config:',
        })
        .option('input.type', {
          type: 'string',
          description: 'An input type',
          choices: ['sources', 'remote'],
          group: 'Input:',
        })
        .option('input.tsConfigFilePath', {
          type: 'string',
          description: `A path to project tsconfig.json`,
          group: 'Sources input:',
        })
        .option('input.sourceFilePath', {
          type: 'string',
          description: `A path to the source file containing routes declaration`,
          group: 'Sources input:',
        })
        .option('input.routesVariable', {
          type: 'string',
          description: `A variable name containing routes object`,
          group: 'Sources input:',
        })
        .option('input.externals', {
          type: 'string',
          array: true,
          description: `A list of external modules to keep imports from`,
          group: 'Sources input:',
        })
        .option('input.url', {
          type: 'string',
          description: `A URL to the JSON containing routes declaration`,
          group: 'Remote input:',
        })
        .option('output.type', {
          type: 'string',
          description: 'An output type',
          choices: ['json', 'ts'],
          group: 'Output:',
        })
        .option('output.targetFilePath', {
          type: 'string',
          description: 'A target file path',
          group: 'Output:',
        })
        .option('output.tsConfigFilePath', {
          type: 'string',
          description: `A path to project tsconfig.json`,
          group: 'Typescript output:',
        })
        .option('context.cwd', {
          type: 'string',
          description: `A working directory`,
          group: 'Context:',
        })
    },
    handler: async (args) => {
      try {
        const parsedArgs = OptionsSchema.parse(args)
        let options: GenerateOptions

        if ('config' in parsedArgs) {
          const configPath = path.resolve(process.cwd(), parsedArgs.config)
          options = JSON.parse(await fs.readFile(configPath, 'utf-8'))
          options.context = options.context ?? {}
          options.context.cwd = path.dirname(configPath)
        } else {
          options = parsedArgs
        }

        await generate(options)
      } catch (error) {
        console.error(`Invalid codegen options`)

        if (error instanceof ZodError) {
          console.log(error.issues)
        } else {
          console.error(error)
        }

        process.exit(1)
      }
    },
  })
  .parse()
