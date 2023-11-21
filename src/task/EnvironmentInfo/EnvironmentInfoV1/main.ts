import tl = require('azure-pipelines-task-lib/task')
import { debug, fixDate, parseAttributes, parseIssueKeys } from '../../../core/utils'
import { sendEnvironmentInfo, SendEnvironmentInfoInputs } from '../../../core/sendEnvironmentInfo'

function parseInput(): SendEnvironmentInfoInputs {
  const targetAutoCreate = tl.getBoolInput('targetAutoCreate', false)
  const inputs: SendEnvironmentInfoInputs = {
    serviceConnection: tl.getInput('serviceConnection', true),
    targetEnvironmentAutoCreate: targetAutoCreate,
    targetEnvironmentId: tl.getInput('targetEnvironmentId', false),
    targetEnvironmentName: tl.getInput('targetEnvironmentName', false),
    targetCategoryName: tl.getInput('targetCategoryName', false),
    targetCategoryId: tl.getInput('targetCategoryId', false),
    targetCategoryAutoCreate: targetAutoCreate,
    targetApplicationId: tl.getInput('targetApplicationId', false),
    targetApplicationName: tl.getInput('targetApplicationName', false),
    targetApplicationAutoCreate: targetAutoCreate,
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

sendEnvironmentInfo('send-environment-info-1', parseInput)
