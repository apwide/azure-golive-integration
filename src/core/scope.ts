import tl = require('azure-pipelines-task-lib/task')
import { getAzureClient } from './AzureClient'
import { extractIssueKeys, log, unique } from './utils'

export async function extractIssueKeysFromCommits() {
  log('Loading Issue keys from commits')
  const azureClient = await getAzureClient()
  const fromBuildId = parseInt(tl.getVariable('Build.BuildId'))
  const lastSuccessfulBuild = await azureClient.getLastSuccessfulBuildDifferentThan(fromBuildId)
  log(`Last successful build was ${lastSuccessfulBuild?.id}`)
  const toCommitId = tl.getVariable('Build.SourceVersion')
  const fromCommitId = lastSuccessfulBuild?.sourceVersion || toCommitId
  const commits = await azureClient.getCommits(fromCommitId, toCommitId)
  log(`${commits.length} commits found`)
  const issueKeys = unique(commits.flatMap((commit) => extractIssueKeys(commit.comment)))
  log(`Issue keys found in commits: ${issueKeys}`)
  return issueKeys
}
