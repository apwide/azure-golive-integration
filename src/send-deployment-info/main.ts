import tl = require('azure-pipelines-task-lib/task')
import { debug, fixDate, log, parseAttributes, parseDefaultBoolean, parseIssueKeys, unique } from '../core/utils'
import { GoliveClient } from '../core/GoliveClient'
import { extractIssueKeysFromCommits } from '../core/scope'
import { getTargetEnvironmentId } from '../core/target'

type SendDeploymentInfoInputs = {
  serviceConnection: string
  targetAutoCreate: boolean
  targetEnvironmentId?: string
  targetEnvironmentName?: string
  targetApplicationId?: string
  targetApplicationName?: string
  targetCategoryId?: string
  targetCategoryName?: string
  versionName: string
  autoCreateVersion?: boolean
  deploymentDescription?: string
  deploymentBuildNumber?: string
  deploymentAttributes?: Record<string, string>
  deploymentDeployedOn?: string
  deploymentIssueKeys?: string[]
  deploymentIssueKeysFromCommitHistory?: boolean
  deploymentJql?: string
  sendNotification?: boolean
}

function parseInputs(): SendDeploymentInfoInputs {
  const inputs: SendDeploymentInfoInputs = {
    serviceConnection: tl.getInput('serviceConnection', true),
    targetAutoCreate: !!tl.getInput('targetAutoCreate', false),
    targetEnvironmentId: tl.getInput('targetEnvironmentId', false),
    targetEnvironmentName: tl.getInput('targetEnvironmentName', false),
    targetCategoryName: tl.getInput('targetCategoryName', false),
    targetCategoryId: tl.getInput('targetCategoryId', false),
    targetApplicationId: tl.getInput('targetApplicationId', false),
    targetApplicationName: tl.getInput('targetApplicationName', false),
    versionName: tl.getInput('versionName', true)!,
    autoCreateVersion: parseDefaultBoolean('autoCreateVersion', tl.getInput('autoCreateVersion', false)),
    deploymentDescription: tl.getInput('deploymentDescription', false),
    deploymentBuildNumber: tl.getInput('deploymentBuildNumber', false),
    deploymentAttributes: parseAttributes(tl.getInput('deploymentAttributes', false)),
    deploymentDeployedOn: fixDate(tl.getInput('deploymentDeployedOn', false)),
    deploymentIssueKeys: parseIssueKeys(tl.getInput('deploymentIssueKeys', false)),
    deploymentIssueKeysFromCommitHistory: !!tl.getInput('deploymentIssueKeysFromCommitHistory', false),
    deploymentJql: tl.getInput('deploymentJql', false),
    sendNotification: !!tl.getInput('sendNotification', false)
  }

  if (!inputs.targetEnvironmentId && !inputs.targetEnvironmentName) {
    throw new Error('At least one of targetEnvironmentId/targetEnvironmentName must be provided')
  }

  debug(`Inputs are ${JSON.stringify(inputs)}`)

  return inputs
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

let inputs: SendDeploymentInfoInputs
let golive: GoliveClient

async function run() {
  try {
    inputs = parseInputs()
    golive = new GoliveClient({ serviceConnection: inputs.serviceConnection })

    const environmentId = await getTargetEnvironmentId(golive, inputs)
    const info = await golive.sendDeploymentInfo({
      environment: {
        id: environmentId
      },
      autoCreateVersion: inputs.autoCreateVersion,
      sendNotification: inputs.sendNotification,
      deployedOn: inputs.deploymentDeployedOn,
      scope: {
        issueKeys: await findIssueKeys(),
        jql: inputs.deploymentJql
      },
      versionName: inputs.versionName,
      buildNumber: inputs.deploymentBuildNumber,
      description: inputs.deploymentDescription,
      attributes: inputs.deploymentAttributes
    })

    log('Deployment information sent', info)
  } catch (err) {
    tl.error(err)
    tl.setResult(tl.TaskResult.Failed, err.message)
  }
}

run()
