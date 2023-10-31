import { GitCommitRef } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces'

export function mockAzureClient({ oldestFailedBuild, commits }: { oldestFailedBuild?: Build; commits?: GitCommitRef[] } = {}) {
  return {
    getAzureClient() {
      return {
        async getOldestFailedBuildDifferentThan() {
          return oldestFailedBuild || null
        },
        async getCommits() {
          return commits || []
        }
      }
    }
  }
}
