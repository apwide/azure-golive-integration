import tl = require('azure-pipelines-task-lib/task')
import { debug, fixDate, parseAttributes, parseIssueKeys } from '../../../core/utils'
import { sendEnvironmentInfo, SendEnvironmentInfoInputs } from '../../../core/sendEnvironmentInfo'

function parseInput(): SendEnvironmentInfoInputs {
  const inputs: SendEnvironmentInfoInputs = {
    serviceConnection: tl.getInput('serviceConnection', true),
    targetEnvironmentId: tl.getInput('targetEnvironmentId', false),
    targetEnvironmentName: tl.getInput('targetEnvironmentName', false),
    targetEnvironmentAutoCreate: tl.getBoolInput('targetEnvironmentAutoCreate', false),
    targetCategoryName: tl.getInput('targetCategoryName', false),
    targetCategoryId: tl.getInput('targetCategoryId', false),
    targetCategoryAutoCreate: tl.getBoolInput('targetCategoryAutoCreate', false),
    targetApplicationId: tl.getInput('targetApplicationId', false),
    targetApplicationName: tl.getInput('targetApplicationName', false),
    targetApplicationAutoCreate: tl.getBoolInput('targetApplicationAutoCreate', false),
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
    deploymentIssuesFromJql: tl.getInput('deploymentIssuesFromJql', false),
    deploymentAttributes: parseAttributes(tl.getInput('deploymentAttributes', false)),
    deploymentSendJiraNotification: tl.getBoolInput('deploymentSendJiraNotification', false),
    deploymentAddDoneIssuesOfJiraVersion: tl.getBoolInput('deploymentAddDoneIssuesOfJiraVersion', false),
    deploymentNoFixVersionUpdate: tl.getBoolInput('deploymentNoFixVersionUpdate', false)
  }

  if (!inputs.targetEnvironmentId && !inputs.targetEnvironmentName) {
    throw new Error('At least one of targetEnvironmentId/targetEnvironmentName must be provided')
  }

  debug(`Inputs are ${JSON.stringify(inputs)}`)

  return inputs
}

sendEnvironmentInfo('send-environment-info-2', parseInput)
