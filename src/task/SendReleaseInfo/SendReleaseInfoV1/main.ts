import tl = require('azure-pipelines-task-lib/task')
import { debug, fixDate, log, parseDefaultBoolean, parseIssueKeys, unique } from '../../../core/utils'
import { GoliveClient } from '../../../core/GoliveClient'
import { extractIssueKeysFromCommits } from '../../../core/scope'
import { getTargetApplicationId } from '../../../core/target'

type ReleaseTaskInputs = {
  serviceConnection: string
  targetAutoCreate?: boolean
  targetApplicationId?: string
  targetApplicationName?: string
  versionName: string
  versionDescription?: string
  versionStartDate?: string
  versionReleaseDate?: string
  versionReleased?: boolean
  issueKeys?: string[]
  issueKeysFromCommitHistory?: boolean
  issuesFromJql?: string
  sendJiraNotification?: boolean
}

function parseInputs(): ReleaseTaskInputs {
  const inputs: ReleaseTaskInputs = {
    serviceConnection: tl.getInput('serviceConnection', true),
    targetAutoCreate: !!tl.getInput('targetAutoCreate', false),
    targetApplicationId: tl.getInput('applicationId', false), //TODO: rename targetApplicationId
    targetApplicationName: tl.getInput('applicationName', false), //TODO: rename targetApplicationName
    versionName: tl.getInput('versionName', true),
    versionDescription: tl.getInput('versionDescription', false),
    versionStartDate: fixDate(tl.getInput('versionStartDate', false)),
    versionReleaseDate: fixDate(tl.getInput('versionReleaseDate', false)),
    versionReleased: tl.getBoolInput('versionReleased', false),
    issueKeys: parseIssueKeys(tl.getInput('issueKeys', false)),
    issueKeysFromCommitHistory: tl.getBoolInput('issueKeysFromCommitHistory', false),
    issuesFromJql: tl.getInput('issuesFromJql', false),
    sendJiraNotification: tl.getBoolInput('sendJiraNotification', false)
  }

  if (!inputs.targetApplicationId && !inputs.targetApplicationName) {
    throw new Error('At least one of applicationId/applicationName must be provided')
  }

  debug(`Inputs are ${JSON.stringify(inputs)}`)

  return inputs
}

let inputs: ReleaseTaskInputs
let golive: GoliveClient

async function findIssueKeys(): Promise<string[]> {
  let issueKeys = []
  if (inputs.issueKeys) {
    log('Loading Issue keys from input')
    issueKeys = [...issueKeys, ...inputs.issueKeys]
  }
  if (inputs.issueKeysFromCommitHistory) {
    issueKeys = [...issueKeys, ...(await extractIssueKeysFromCommits())]
  }
  const found = unique(issueKeys)
  log('Found issue keys', found)
  return found
}

async function run() {
  try {
    inputs = parseInputs()
    golive = new GoliveClient({ taskId: 'send-release-info', serviceConnection: inputs.serviceConnection })

    const applicationId = await getTargetApplicationId(golive, inputs)
    const info = await golive.sendReleaseInfo({
      application: {
        id: applicationId
      },
      versionDescription: inputs.versionDescription,
      versionName: inputs.versionName,
      startDate: inputs.versionStartDate,
      releaseDate: inputs.versionReleaseDate,
      released: inputs.versionReleased,
      issues: {
        issueKeys: await findIssueKeys(),
        jql: inputs.issuesFromJql,
        sendJiraNotification: inputs.sendJiraNotification
      }
    })

    log('Release information sent', info)
  } catch (err) {
    tl.error(err)
    tl.setResult(tl.TaskResult.Failed, err.message)
  }
}

run()
