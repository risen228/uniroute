import commonPathPrefix from 'common-path-prefix'
import { execa } from 'execa'
import fs from 'node:fs'
import path from 'node:path'

interface Options {
  outputDir: string
  packageJsonPath: string
  updateBin?: boolean
  updateExports?: boolean
  updateEntrypoints?: boolean
}

export async function movePackageJson({
  outputDir,
  packageJsonPath,
  updateBin = false,
  updateExports = true,
  updateEntrypoints = true,
}: Options) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))

  fs.cpSync(packageJsonPath, path.join(outputDir, 'package.json'))

  const commonPath = commonPathPrefix([packageJsonPath, outputDir])

  const relativeToOutputDir = (entry: string) => {
    const absoluteEntryPath = path.resolve(commonPath, entry)
    const relative = path.relative(outputDir, absoluteEntryPath)
    return relative.startsWith('./') ? relative : `./${relative}`
  }

  const replacedExports = Object.fromEntries(
    Object.entries(pkg.exports ?? {}).map(([key, value]) => {
      if (typeof value !== 'object' || value === null) {
        return [key, value]
      }

      return [
        key,
        Object.fromEntries(
          Object.entries(value).map(([key, value]) => {
            return [key, relativeToOutputDir(value)]
          }),
        ),
      ]
    }),
  )

  const replacedBin = Object.fromEntries(
    Object.entries(pkg.bin ?? {}).map(([key, value]) => {
      if (typeof value !== 'string') {
        return [key, value]
      }

      return [key, relativeToOutputDir(value)]
    }),
  )

  const updatedFields = [
    updateEntrypoints &&
      Boolean(pkg.main) &&
      `main="${relativeToOutputDir(pkg.main)}"`,
    updateEntrypoints &&
      Boolean(pkg.module) &&
      `module="${relativeToOutputDir(pkg.module)}"`,
    updateEntrypoints &&
      Boolean(pkg.types) &&
      `types="${relativeToOutputDir(pkg.types)}"`,
    updateBin &&
      Object.entries(replacedBin).length > 0 &&
      `bin=${JSON.stringify(replacedBin)}`,
    updateExports &&
      Object.entries(replacedExports).length > 0 &&
      `exports=${JSON.stringify(replacedExports)}`,
  ].filter((arg): arg is string => {
    return Boolean(arg)
  })

  if (updatedFields.length > 0) {
    const args = ['pkg', 'set', '--json', ...updatedFields]
    await execa('npm', args, { cwd: outputDir })
  }
}
