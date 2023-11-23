import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import fsExtra from 'fs-extra'
import { execa } from 'execa'
import { rollup } from 'rollup'

const dirname = fileURLToPath(new URL('.', import.meta.url))
const pkgPath = path.resolve(dirname, 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const distPath = path.resolve(dirname, 'dist')
const src = (file) => path.resolve(dirname, `src/${file}`)
const dist = (file) => path.resolve(distPath, file)

const external = (id) => !/^[./]/.test(id)

async function buildCLI() {
  const bundle = await rollup({
    input: src('cli/index.ts'),
    external,
    plugins: [esbuild()],
  })

  await bundle.write({
    file: dist(`bin/uniroute.js`),
    format: 'cjs',
    banner: '#!/usr/bin/env node',
  })
}

async function build() {
  fsExtra.emptyDirSync(distPath)

  await buildCLI()

  const input = {
    index: src('index.ts'),
    client: src('client/index.ts'),
    server: src('server/index.ts'),
    codegen: src('codegen/index.ts'),
  }

  const bundle = await rollup({
    input,
    external,
    plugins: [esbuild()],
  })

  await bundle.write({
    dir: distPath,
    format: 'es',
    minifyInternalExports: false,
    entryFileNames: '[name].mjs',
  })

  await bundle.write({
    dir: distPath,
    format: 'cjs',
    entryFileNames: '[name].js',
  })

  const types = await rollup({
    input,
    external,
    plugins: [dts()],
  })

  await types.write({
    dir: distPath,
    format: 'es',
    minifyInternalExports: false,
    entryFileNames: '[name].d.ts',
  })

  await types.write({
    dir: distPath,
    format: 'es',
    minifyInternalExports: false,
    entryFileNames: '[name].d.mts',
  })

  fs.cpSync(pkgPath, dist('package.json'))

  const replacedExports = Object.fromEntries(
    Object.entries(pkg.exports ?? {}).map(([key, value]) => [
      key,
      Object.fromEntries(
        Object.entries(value).map(([key, value]) => [
          key,
          value.replace('./dist', '.'),
        ]),
      ),
    ]),
  )

  const replacedBin = Object.fromEntries(
    Object.entries(pkg.bin ?? {}).map(([key, value]) => [
      key,
      value.replace('./dist', '.'),
    ]),
  )

  await execa(
    'npm',
    [
      'pkg',
      'set',
      '--json',
      `bin=${JSON.stringify(replacedBin)}`,
      `main="${pkg.main.replace('./dist', '.')}"`,
      `module="${pkg.module.replace('./dist', '.')}"`,
      `types="${pkg.types.replace('./dist', '.')}"`,
      `exports=${JSON.stringify(replacedExports)}`,
    ],
    { cwd: distPath },
  )
}

void build()
