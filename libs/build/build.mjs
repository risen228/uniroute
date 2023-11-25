import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fsExtra from 'fs-extra'
import { rollup } from 'rollup'

const dirname = fileURLToPath(new URL('.', import.meta.url))

const distPath = path.resolve(dirname, 'dist')
const src = (file) => path.resolve(dirname, `src/${file}`)
const dist = (file) => path.resolve(distPath, file)

const external = (id) => !/^[./]/.test(id)

async function build() {
  fsExtra.emptyDirSync(distPath)

  const input = src('index.ts')

  const bundle = await rollup({
    input,
    external,
    plugins: [esbuild()],
  })

  await bundle.write({
    file: dist(`index.mjs`),
    format: 'es',
  })

  await bundle.write({
    file: dist(`index.js`),
    format: 'cjs',
  })

  const types = await rollup({
    input,
    external,
    plugins: [dts()],
  })

  await types.write({
    file: dist(`index.d.ts`),
    format: 'es',
  })

  await types.write({
    file: dist(`index.d.mts`),
    format: 'es',
  })
}

void build()
