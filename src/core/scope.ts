import tl = require('azure-pipelines-task-lib/task')
import { AzureClient, getAzureClient } from './AzureClient'
import { debug, extractIssueKeys, log, unique } from './utils'
import { execSync } from 'node:child_process'

export async function extractIssueKeysFromCommits() {
  log('Loading Issue keys from commits')
  const azureClient = await getAzureClient()
  const fromBuildId = parseInt(tl.getVariable('Build.BuildId'))
  const builds = await azureClient.getBuilds()
  const lastSuccessfulBuild = builds.getLastSuccessfulBuildDifferentThan(fromBuildId)
  debug(`Last successful build was ${lastSuccessfulBuild?.id}`)
  const toCommitId = tl.getVariable('Build.SourceVersion')
  const fromCommitId = lastSuccessfulBuild?.sourceVersion || toCommitId
  const issueKeys = unique([
    ...(await extractFromRelease(azureClient)),
    ...(await extractIssueKeysFromGitApi(azureClient, fromCommitId, toCommitId)),
    ...(await extractIssueKeysFromBuildChanges(azureClient, fromBuildId)),
    ...extractIssueKeysFromCli(fromCommitId, toCommitId)
    // ...extractIssueKeysFromTfvc(fromCommitId, toCommitId)
  ])
  log(`Total Issue keys found in commits: ${issueKeys}`)
  return issueKeys
}

async function extractFromRelease(azureClient: AzureClient) {
  try {
    log(`Extract Issue keys from release changes`)
    const releaseId = parseInt(tl.getVariable('Release.ReleaseId'))
    const changes = await azureClient.getChangesFromRelease(releaseId)
    const issueKeys = extractIssueKeys(changes.join(' '))
    log(`Issue keys found from releases: ${issueKeys}`)
    return issueKeys
  } catch (error) {
    log(`Not able to get release info ${error}`)
    return []
  }
}

// function extractIssueKeysFromTfvc(fromCommitId: string, toCommitId: string) {
//   try {
//     const logs = execSync(`tf history $/`).toString()
//     log(`TF log: ${logs}`)
//     return extractIssueKeys(logs)
//   } catch (error) {
//     debug(`Not able to load issue keys from TFVC due to: ${error}`)
//     return []
//   }
// }

// no need to do fromBuildId to toBuildId because Azure automatically returns all of the changes since the last successful job
async function extractIssueKeysFromBuildChanges(azureClient: AzureClient, buildId: number) {
  try {
    log(`Extract Issue keys from build changes`)
    const changes = await azureClient.getChanges(buildId)
    debug(`Found ${changes.length} changes in build ${buildId}`)
    const issueKeys = extractIssueKeys(changes.map((change) => change.message).join(' '))
    log(`Issue keys found from build changes: ${issueKeys}`)
    return issueKeys
  } catch (error) {
    log('Not able to load issue keys from changes')
    debug(`Error when loading from build changes was: ${error}`)
    return []
  }
}

async function extractIssueKeysFromGitApi(azureClient: AzureClient, fromCommitId: string, toCommitId: string) {
  try {
    log('Extract commits from Azure git API')
    const commits = await azureClient.getCommits(fromCommitId, toCommitId)
    debug(`${commits.length} commits found for commits ${fromCommitId}..${toCommitId}`)
    const issueKeys = commits.flatMap((commit) => extractIssueKeys(commit.comment))
    log(`Issue keys found in commits from Azure git API: ${issueKeys}`)
    return issueKeys
  } catch (error) {
    log('Not able to load issue keys from Azure git API (probably pipeline not hosted on Azure GIT repo)')
    debug(`Error when loading from git Rest API was: ${error}`)
    return []
  }
}

function extractIssueKeysFromCli(fromCommitId: string, toCommitId: string): string[] {
  try {
    log('Extract commits from git CLI')
    let issueKeys = []
    if (fromCommitId == toCommitId) {
      debug('fromCommit equals toCommit, use different strategy')
      const commitCount = Number(execSync('git rev-list HEAD --count').toString())
      if (commitCount == 1) {
        debug('Only 1 commits, search for entire git log')
        const logs = execSync(`git log --format="%s %b"`).toString()
        issueKeys = extractIssueKeys(logs)
      } else {
        debug(`Search in git log with HEAD~1..HEAD`)
        const logs = execSync(`git log "HEAD~1..HEAD" --format="%s %b"`).toString()
        issueKeys = extractIssueKeys(logs)
      }
    } else {
      const logs = execSync(`git log "${fromCommitId}..HEAD" --format="%s %b"`).toString()
      issueKeys = extractIssueKeys(logs)
    }
    log(`Issue keys found in commits from CLI: ${issueKeys}`)
    return issueKeys
  } catch (error) {
    log('Not able to parse git log (are you in shallow checkout ?)')
    debug(`Error when parsing git repository was: ${error}`)
    return []
  }
}
