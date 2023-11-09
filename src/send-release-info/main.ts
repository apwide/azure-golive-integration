import tl = require('azure-pipelines-task-lib/task')
import { debug, fixDate, log, parseDefaultBoolean, parseIssueKeys, unique } from '../core/utils'
import { GoliveClient } from '../core/GoliveClient'
import { extractIssueKeysFromCommits } from '../core/scope'
import { getTargetApplicationId } from '../core/target'

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
  autoCreateVersion?: boolean
  scopeIssueKeys?: string[]
  scopeIssueKeysFromCommitHistory?: boolean
  scopeJql?: string
  sendNotification?: boolean
}

function parseInputs(): ReleaseTaskInputs {
  const inputs: ReleaseTaskInputs = {
    serviceConnection: tl.getInput('serviceConnection', true),
    targetAutoCreate: !!tl.getInput('targetAutoCreate', false),
    targetApplicationId: tl.getInput('targetApplicationId', false),
    targetApplicationName: tl.getInput('targetApplicationName', false),
    versionName: tl.getInput('versionName', true),
    versionDescription: tl.getInput('versionDescription', false),
    versionStartDate: fixDate(tl.getInput('versionStartDate', false)),
    versionReleaseDate: fixDate(tl.getInput('versionReleaseDate', false)),
    versionReleased: !!tl.getInput('versionReleased', false),
    autoCreateVersion: parseDefaultBoolean('autoCreateVersion', tl.getInput('autoCreateVersion', false)),
    scopeIssueKeys: parseIssueKeys(tl.getInput('scopeIssueKeys', false)),
    scopeIssueKeysFromCommitHistory: !!tl.getInput('scopeIssueKeysFromCommitHistory', false),
    scopeJql: tl.getInput('scopeJql', false),
    sendNotification: !!tl.getInput('sendNotification', false)
  }

  if (!inputs.targetApplicationId && !inputs.targetApplicationName) {
    throw new Error('At least one of targetApplicationId/targetApplicationName must be provided')
  }

  debug(`Inputs are ${JSON.stringify(inputs)}`)

  return inputs
}

let inputs: ReleaseTaskInputs
let golive: GoliveClient

async function findIssueKeys(): Promise<string[]> {
  let issueKeys = []
  if (inputs.scopeIssueKeys) {
    log('Loading Issue keys from input')
    issueKeys = [...issueKeys, ...inputs.scopeIssueKeys]
  }
  if (inputs.scopeIssueKeysFromCommitHistory) {
    issueKeys = [...issueKeys, ...(await extractIssueKeysFromCommits())]
  }
  return unique(issueKeys)
}

async function run() {
  try {
    inputs = parseInputs()
    golive = new GoliveClient({ serviceConnection: inputs.serviceConnection })

    const applicationId = await getTargetApplicationId(golive, inputs)
    const info = await golive.sendReleaseInfo({
      application: {
        id: applicationId
      },
      autoCreateVersion: inputs.autoCreateVersion,
      sendNotification: inputs.sendNotification,
      versionDescription: inputs.versionDescription,
      versionName: inputs.versionName,
      startDate: inputs.versionStartDate,
      releaseDate: inputs.versionReleaseDate,
      released: inputs.versionReleased,
      scope: {
        issueKeys: await findIssueKeys(),
        jql: inputs.scopeJql
      }
    })

    log('Release information sent', info)
  } catch (err) {
    tl.error(err)
    tl.setResult(tl.TaskResult.Failed, err.message)
  }
}

run()
