import { GitCommitRef } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { Build } from 'azure-devops-node-api/interfaces/BuildInterfaces'

export function mockAzureClient({
  lastSuccessfulBuild,
  oldestFailedBuild,
  commits
}: { oldestFailedBuild?: Build; lastSuccessfulBuild?: Build; commits?: GitCommitRef[] } = {}) {
  return {
    getAzureClient() {
      return {
        async getLastSuccessfulBuildDifferentThan() {
          return lastSuccessfulBuild || null
        },
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
