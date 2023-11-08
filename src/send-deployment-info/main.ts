import tl = require('azure-pipelines-task-lib/task')
import { debug, fixDate, log, parseAttributes, parseDefaultBoolean, parseIssueKeys, unique } from '../core/utils'
import { GoliveClient } from '../core/GoliveClient'
import { extractIssueKeysFromCommits } from '../core/scope'

type SendDeploymentInfoInputs = {
  serviceConnection: string
  targetEnvironmentId?: string
  targetEnvironmentName?: string
  versionName: string
  autoCreateVersion?: boolean
  description?: string
  buildNumber?: string
  attributes?: Record<string, string>
  deployedOn?: string
  issueKeys?: string[]
  issueKeysFromCommitHistory?: boolean
  jql?: string
  sendNotification?: boolean
}

function parseInputs(): SendDeploymentInfoInputs {
  const inputs: SendDeploymentInfoInputs = {
    serviceConnection: tl.getInput('serviceConnection', true),
    targetEnvironmentId: tl.getInput('targetEnvironmentId', false),
    targetEnvironmentName: tl.getInput('targetEnvironmentName', false),
    versionName: tl.getInput('versionName', true)!,
    autoCreateVersion: parseDefaultBoolean('autoCreateVersion', tl.getInput('autoCreateVersion', false)),
    description: tl.getInput('description', false),
    buildNumber: tl.getInput('buildNumber', false),
    attributes: parseAttributes(tl.getInput('attributes', false)),
    deployedOn: fixDate(tl.getInput('deployedOn', false)),
    issueKeys: parseIssueKeys(tl.getInput('issueKeys', false)),
    issueKeysFromCommitHistory: !!tl.getInput('issueKeysFromCommitHistory', false),
    jql: tl.getInput('jql:', false),
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
  if (inputs.issueKeys) {
    log('Loading Issue keys from input')
    issueKeys = [...issueKeys, ...inputs.issueKeys]
  }
  if (inputs.issueKeysFromCommitHistory) {
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

    const info = await golive.sendDeploymentInfo({
      environment: {
        id: inputs.targetEnvironmentId,
        name: inputs.targetEnvironmentName
      },
      autoCreateVersion: inputs.autoCreateVersion,
      sendNotification: inputs.sendNotification,
      deployedOn: inputs.deployedOn,
      scope: {
        issueKeys: await findIssueKeys(),
        jql: inputs.jql
      },
      versionName: inputs.versionName,
      buildNumber: inputs.buildNumber,
      description: inputs.description,
      attributes: inputs.attributes
    })

    log('Deployment information sent', info)
  } catch (err) {
    tl.error(err)
    tl.setResult(tl.TaskResult.Failed, err.message)
  }
}

run()
