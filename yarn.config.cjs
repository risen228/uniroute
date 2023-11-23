/** @type {import('@yarnpkg/types')} */
const { defineConfig } = require('@yarnpkg/types')

/**
 * This rule will enforce that a workspace MUST depend on the same version of
 * a dependency as the one used by the other workspaces.
 *
 * @param {import('@yarnpkg/types').Yarn} Yarn
 */
function enforceConsistentDependenciesAcrossTheProject(Yarn) {
  for (const dependencyA of Yarn.dependencies()) {
    if (dependencyA.type === `peerDependencies`)
      continue;

    for (const dependencyB of Yarn.dependencies({ ident: dependencyA.ident })) {
      if (dependencyB.type === `peerDependencies`)
        continue;

      dependencyA.update(dependencyB.range);
    }
  }
}

/**
 * This rule will enforce that a workspace MUST depend on the same version of
 * a dependency as the one used by the other workspaces.
 *
 * @param {import('@yarnpkg/types').Yarn} Yarn
 */
function enforceRemovingDuplicatedDependenciesAcrossTheProject(Yarn) {
  for (const dependencyA of Yarn.dependencies()) {
    if (dependencyA.type !== `dependencies`)
      continue;

    for (const dependencyB of Yarn.dependencies({
      ident: dependencyA.ident,
      workspace: dependencyA.workspace,
    })) {
      if (dependencyB.type !== `devDependencies`)
        continue;

      throw new Error(`Duplicated dependency ${dependencyA.ident} in workspace ${dependencyA.workspace.cwd}`);
    }
  }
}

module.exports = defineConfig({
  async constraints({ Yarn }) {
    enforceConsistentDependenciesAcrossTheProject(Yarn)
    enforceRemovingDuplicatedDependenciesAcrossTheProject(Yarn)
  },
})
