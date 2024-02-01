import { Build, BuildResult } from 'azure-devops-node-api/interfaces/BuildInterfaces'

function isSuccessful(result: BuildResult): boolean {
  return result === BuildResult.Succeeded || result === BuildResult.PartiallySucceeded
}

export class Builds {
  readonly lastBuilds: Build[]

  constructor(lastBuilds: Build[]) {
    this.lastBuilds = lastBuilds
  }

  getLastSuccessfulBuildDifferentThan(buildId: number): Build | null {
    return this.lastBuilds.find(({ id, result }) => id !== buildId && isSuccessful(result)) || null
  }

  getOldestFailedBuildDifferentThan(buildId: number): Build | null {
    const builds = this.lastBuilds
    // builds.forEach((build) => {
    //   log(`build ${build.id}-${build.buildNumber} finished on ${build.finishTime} resulted in ${build.result}`)
    // })

    let oldestFailedBuild: Build | undefined = undefined
    for (const build of builds) {
      if (build.id === buildId) {
        continue
      }
      if (build.result === BuildResult.Succeeded || build.result === BuildResult.PartiallySucceeded) {
        break
      }
      oldestFailedBuild = build
    }
    return oldestFailedBuild || null
  }
}
