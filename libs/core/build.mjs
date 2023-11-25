import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  buildCLI,
  buildLibrary,
  movePackageJson,
  emptyDirectory,
} from '@tooling/build'

const dirname = fileURLToPath(new URL('.', import.meta.url))
const pkgPath = path.resolve(dirname, 'package.json')

const distPath = path.resolve(dirname, 'dist')
const src = (file) => path.resolve(dirname, `src/${file}`)
const dist = (file) => path.resolve(distPath, file)

async function build() {
  emptyDirectory(distPath)

  await buildCLI({
    input: src('cli/index.ts'),
    output: dist('bin/uniroute.js'),
  })

  await buildLibrary({
    type: 'multi',
    input: {
      index: src('index.ts'),
      client: src('client/index.ts'),
      server: src('server/index.ts'),
      codegen: src('codegen/index.ts'),
    },
    outputDir: distPath,
  })

  await movePackageJson({
    outputDir: distPath,
    packageJsonPath: pkgPath,
  })
}

void build()
