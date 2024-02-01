import { GitCommitRef } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { Build, Change } from 'azure-devops-node-api/interfaces/BuildInterfaces'
import { Builds } from '../core/Builds'

export function mockAzureClient({ builds, commits, changes }: { builds?: Build[]; commits?: GitCommitRef[]; changes?: Change[] } = {}) {
  return {
    getAzureClient() {
      return {
        async getBuilds() {
          return new Builds(builds || [])
        },
        async getCommits() {
          return commits || []
        },
        async getChanges() {
          return changes || []
        },
        async getChangesBetween() {
          return changes || []
        }
      }
    }
  }
}
