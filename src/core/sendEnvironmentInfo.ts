import tl = require('azure-pipelines-task-lib/task')
import { log, unique } from '../core/utils'
import { extractIssueKeysFromCommits } from '../core/scope'
import { DeploymentInfo, EnvironmentInfo, GoliveClient, NamedReference } from '../core/GoliveClient'

export type SendEnvironmentInfoInputs = {
  serviceConnection: string
  targetEnvironmentId?: string
  targetEnvironmentName?: string
  targetEnvironmentAutoCreate?: boolean
  targetCategoryName?: string
  targetCategoryId?: string
  targetCategoryAutoCreate?: boolean
  targetApplicationId?: string
  targetApplicationName?: string
  targetApplicationAutoCreate?: boolean
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
  deploymentIssuesFromJql?: string
  deploymentAttributes?: Record<string, string>
  deploymentSendJiraNotification: boolean
  deploymentAddDoneIssuesOfJiraVersion: boolean
  deploymentNoFixVersionUpdate: boolean
}

async function findIssueKeys(inputs: SendEnvironmentInfoInputs): Promise<string[]> {
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
  const issueKeys = await findIssueKeys(inputs)
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
      jql: inputs.deploymentIssuesFromJql,
      noFixVersionUpdate: inputs.deploymentNoFixVersionUpdate,
      addDoneIssuesFixedInVersion: inputs.deploymentAddDoneIssuesOfJiraVersion,
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

export async function sendEnvironmentInfo(taskId: string, GetInputs: () => SendEnvironmentInfoInputs) {
  try {
    const inputs = GetInputs()
    const golive = new GoliveClient({ taskId, serviceConnection: inputs.serviceConnection })

    const deployment = await toDeployment(inputs)
    const status = toStatus(inputs)
    const environment = toEnvironment(inputs)

    if (inputs.targetEnvironmentId && !deployment && !status && !environment) {
      log(`No information to send to environment ${inputs.targetEnvironmentId}`)
      return
    }

    await golive.sendEnvironmentInfo({
      environmentSelector: {
        environment: {
          id: inputs.targetEnvironmentId,
          name: inputs.targetEnvironmentName,
          autoCreate: inputs.targetEnvironmentAutoCreate
        },
        application: {
          id: inputs.targetApplicationId,
          name: inputs.targetApplicationName,
          autoCreate: inputs.targetApplicationAutoCreate
        },
        category: {
          id: inputs.targetCategoryId,
          name: inputs.targetCategoryName,
          autoCreate: inputs.targetCategoryAutoCreate
        }
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
