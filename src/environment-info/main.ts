import tl = require('azure-pipelines-task-lib/task')
import { DeploymentInfo, EnvironmentInfo, GoliveClient, NamedReference } from './../core/GoliveClient'
import { debug, fixDate, log, parseAttributes, parseIssueKeys, unique } from './../core/utils'
import { extractIssueKeysFromCommits } from './../core/scope'

type SendEnvironmentInfoInputs = {
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
  deploymentDeployedDate?: string
  deploymentBuildNumber?: string
  deploymentDescription?: string
  deploymentIssueKeys?: string[]
  deploymentIssueKeysFromCommitHistory: boolean
  deploymentJql?: string
  deploymentAttributes?: Record<string, string>
  deploymentSendJiraNotification: boolean
  deploymentAddDoneIssuesFixedInVersion: boolean
  deploymentNoFixVersionUpdate: boolean
}

function parseInput(): SendEnvironmentInfoInputs {
  const inputs: SendEnvironmentInfoInputs = {
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
    deploymentDeployedDate: fixDate(tl.getInput('deploymentDeployedDate', false)),
    deploymentBuildNumber: tl.getInput('deploymentBuildNumber', false),
    deploymentDescription: tl.getInput('deploymentDescription', false),
    deploymentIssueKeys: parseIssueKeys(tl.getInput('deploymentIssueKeys', false)),
    deploymentIssueKeysFromCommitHistory: tl.getBoolInput('deploymentIssueKeysFromCommitHistory', false),
    deploymentJql: tl.getInput('deploymentJql', false),
    deploymentAttributes: parseAttributes(tl.getInput('deploymentAttributes', false)),
    deploymentSendJiraNotification: tl.getBoolInput('deploymentSendJiraNotification', false),
    deploymentAddDoneIssuesFixedInVersion: tl.getBoolInput('deploymentAddDoneIssuesFixedInVersion', false),
    deploymentNoFixVersionUpdate: tl.getBoolInput('deploymentNoFixVersionUpdate', false)
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
  const found = unique(issueKeys)
  log('Found issue keys', found)
  return found
}

async function toDeployment(inputs: SendEnvironmentInfoInputs): Promise<DeploymentInfo | undefined> {
  const issueKeys = await findIssueKeys()
  if (!inputs.deploymentVersionName && !inputs.deploymentAttributes && !inputs.deploymentBuildNumber && !inputs.deploymentDescription && !issueKeys.length) {
    return undefined
  }

  return {
    versionName: inputs.deploymentVersionName,
    attributes: inputs.deploymentAttributes,
    buildNumber: inputs.deploymentBuildNumber,
    deployedDate: inputs.deploymentDeployedDate,
    description: inputs.deploymentDescription,
    issues: {
      issueKeys: issueKeys.length ? issueKeys : undefined,
      jql: inputs.deploymentJql,
      noFixVersionUpdate: inputs.deploymentNoFixVersionUpdate,
      addDoneIssuesFixedInVersion: inputs.deploymentAddDoneIssuesFixedInVersion,
      sendJiraNotification: inputs.deploymentSendJiraNotification
    }
  }
}

function toStatus({ environmentStatusId, environmentStatusName }: SendEnvironmentInfoInputs): NamedReference | undefined {
  if (!environmentStatusId && !environmentStatusName) {
    return undefined
  }
  return {
    id: environmentStatusId,
    name: environmentStatusName
  }
}

function toEnvironment({ environmentUrl, environmentAttributes }: SendEnvironmentInfoInputs): EnvironmentInfo | undefined {
  if (!environmentUrl && !Object.keys(environmentAttributes || {}).length) {
    return undefined
  }
  return {
    url: environmentUrl,
    attributes: environmentAttributes
  }
}

let inputs: SendEnvironmentInfoInputs
let golive: GoliveClient

async function run() {
  try {
    inputs = parseInput()
    golive = new GoliveClient({ serviceConnection: inputs.serviceConnection })

    const deployment = await toDeployment(inputs)
    const status = toStatus(inputs)
    const environment = toEnvironment(inputs)

    if (inputs.targetEnvironmentId && !deployment && !status && !environment) {
      log(`No information to send to environment ${inputs.targetEnvironmentId}`)
      return
    }

    await golive.sendEnvironmentInfo({
      target: {
        environment: {
          id: inputs.targetEnvironmentId,
          name: inputs.targetEnvironmentName
        },
        application: {
          id: inputs.targetApplicationId,
          name: inputs.targetApplicationName
        },
        category: {
          id: inputs.targetCategoryId,
          name: inputs.targetCategoryName
        },
        autoCreate: inputs.targetAutoCreate
      },
      environment,
      status,
      deployment
    })
  } catch (err) {
    tl.error(err)
    tl.setResult(tl.TaskResult.Failed, err.message)
  }
}

run()
