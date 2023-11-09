import tl = require('azure-pipelines-task-lib/task')
import { GoliveClient } from './../core/GoliveClient'
import { log, parseAttributes, parseIssueKeys, unique } from './../core/utils'
import { extractIssueKeysFromCommits } from './../core/scope'
import { getTargetEnvironmentId } from '../core/target'

type GoliveInputs = {
  targetAutoCreate?: boolean
  serviceConnection: string
  targetEnvironmentId?: string
  targetEnvironmentName?: string
  targetCategoryName?: string
  targetCategoryId?: string
  targetApplicationId?: string
  targetApplicationName?: string
  environmentStatusId?: string
  environmentStatusName?: string

  environmentUrl?: string
  environmentAttributes?: Record<string, string>

  deploymentVersionName?: string
  deploymentBuildNumber?: string
  deploymentDescription?: string
  deploymentIssueKeys?: string[]
  deploymentIssueKeysFromCommitHistory: boolean
  deploymentAttributes?: Record<string, string>
}

function parseInput(): GoliveInputs {
  return {
    serviceConnection: tl.getInput('serviceConnection', true),
    targetAutoCreate: !!tl.getInput('targetAutoCreate', false),
    targetEnvironmentId: tl.getInput('targetEnvironmentId', false),
    targetEnvironmentName: tl.getInput('targetEnvironmentName', false),
    targetCategoryName: tl.getInput('targetCategoryName', false),
    targetCategoryId: tl.getInput('targetCategoryId', false),
    targetApplicationId: tl.getInput('targetApplicationId', false),
    targetApplicationName: tl.getInput('targetApplicationName', false),
    environmentStatusId: tl.getInput('environmentStatusId', false),
    environmentStatusName: tl.getInput('environmentStatusName', false),
    environmentUrl: tl.getInput('environmentUrl', false),
    environmentAttributes: parseAttributes(tl.getInput('environmentAttributes', false)),
    deploymentVersionName: tl.getInput('deploymentVersionName', false),
    deploymentBuildNumber: tl.getInput('deploymentBuildNumber', false),
    deploymentDescription: tl.getInput('deploymentDescription', false),
    deploymentIssueKeys: parseIssueKeys(tl.getInput('deploymentIssueKeys', false)),
    deploymentIssueKeysFromCommitHistory: tl.getBoolInput('deploymentIssueKeysFromCommitHistory', false),
    deploymentAttributes: parseAttributes(tl.getInput('deploymentAttributes', false))
  }
}

async function updateDeployment({ environmentId }) {
  const issueKeys = await findIssueKeys()

  log('Found issue keys', issueKeys)

  if (!inputs.deploymentVersionName && !inputs.deploymentBuildNumber && !inputs.deploymentDescription && !inputs.deploymentAttributes && !issueKeys.length) {
    return
  }

  const deployment = await golive.deploy(environmentId, {
    versionName: inputs.deploymentVersionName,
    buildNumber: inputs.deploymentBuildNumber,
    description: inputs.deploymentDescription,
    attributes: inputs.deploymentAttributes,
    issueKeys
  })
  if (!deployment) {
    log('Environment Deployment unchanged')
  } else {
    log('Deployment performed response', deployment)
  }
}

async function updateStatus({ environmentId }) {
  if ((!environmentId && !inputs.environmentStatusName) || (!inputs.environmentStatusId && !inputs.environmentStatusName)) {
    return
  }

  const status = await golive.updateStatus(environmentId, {
    id: inputs.environmentStatusId,
    name: inputs.environmentStatusName
  })
  if (!status) {
    log('Environment Status unchanged')
  } else {
    log('Environment Status changed response', status)
  }
}

async function updateEnvironment({ environmentId }) {
  if (!inputs.environmentUrl && !inputs.environmentAttributes) {
    return
  }
  const env = await golive.updateEnvironment(environmentId, {
    url: inputs.environmentUrl,
    attributes: inputs.environmentAttributes
  })
  log('Environment updated response', env)
}

async function findIssueKeys(): Promise<string[]> {
  let issueKeys = []
  if (inputs.deploymentIssueKeys) {
    log('Loading Issue keys from input')
    issueKeys = [...issueKeys, ...inputs.deploymentIssueKeys]
  }
  if (inputs.deploymentIssueKeysFromCommitHistory) {
    issueKeys = [...issueKeys, ...(await extractIssueKeysFromCommits())]
  }
  return unique(issueKeys)
}

let inputs: GoliveInputs
let golive: GoliveClient

async function run() {
  try {
    inputs = parseInput()
    golive = new GoliveClient({ serviceConnection: inputs.serviceConnection })

    const environmentId = await getTargetEnvironmentId(golive, inputs)
    await updateDeployment({ environmentId })
    await updateStatus({ environmentId })
    await updateEnvironment({ environmentId })
  } catch (err) {
    tl.error(err)
    tl.setResult(tl.TaskResult.Failed, err.message)
  }
}

run()
