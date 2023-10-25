import tl = require('azure-pipelines-task-lib/task')
import { GoliveClient } from './GoliveClient'
import { log, parseAttributes, parseIssueKeys } from './utils'

type GoliveInputs = {
  targetAutoCreate?: boolean
  serviceConnection: string
  targetEnvironmentId?: string
  targetEnvironmentName?: string
  targetCategoryName?: string
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
  deploymentAttributes?: Record<string, string>
}

function parseInput(): GoliveInputs {
  return {
    serviceConnection: tl.getInput('serviceConnection', true),
    targetAutoCreate: !!tl.getInput('targetAutoCreate', false),
    targetEnvironmentId: tl.getInput('targetEnvironmentId', false),
    targetEnvironmentName: tl.getInput('targetEnvironmentName', false),
    targetCategoryName: tl.getInput('targetCategoryName', false),
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
    deploymentAttributes: parseAttributes(tl.getInput('deploymentAttributes', false))
  }
}

async function getTargetEnvironmentId(): Promise<string> {
  if (inputs.targetEnvironmentId) {
    return inputs.targetEnvironmentId
  }

  if (inputs.targetEnvironmentName) {
    const environment = await golive.getEnvironmentByName(inputs.targetEnvironmentName)
    log('Found environment', environment)
    if (environment) {
      return environment.id
    }
    if (inputs.targetAutoCreate) {
      const applicationId = await getTargetApplicationId()
      if (!applicationId) {
        return
      }
      const categoryId = await getTargetCategoryId()
      if (!categoryId) {
        return
      }
      log(`Create environment with application ${applicationId}, category ${categoryId} and name ${inputs.targetEnvironmentName}`)
      const environment = await golive.createEnvironment({
        name: inputs.targetEnvironmentName,
        application: {
          id: applicationId
        },
        category: {
          id: categoryId
        }
      })
      log('Environment created response', environment)
      return environment?.id
    }
  }
}

async function getTargetApplicationId(): Promise<string> {
  if (inputs.targetApplicationId) {
    return inputs.targetApplicationId
  }

  if (inputs.targetApplicationName) {
    const application = await golive.getApplicationByName(inputs.targetApplicationName)
    log('Found application', application)
    if (application) {
      return application.id
    }
    if (inputs.targetAutoCreate) {
      log(`Create application with name ${inputs.targetApplicationName}`)
      const application = await golive.createApplication({
        name: inputs.targetApplicationName
      })
      log('Application created response', application)
      return application.id
    }
  }
}

async function getTargetCategoryId(): Promise<string> {
  if (inputs.targetEnvironmentId) {
    return inputs.targetEnvironmentId
  }

  if (inputs.targetCategoryName) {
    const category = await golive.getCategoryByName(inputs.targetCategoryName)
    log('Found category', category)
    if (category) {
      return category.id
    }
    if (inputs.targetAutoCreate) {
      log(`Create category with name ${inputs.targetCategoryName}`)
      const category = await golive.createCategory({
        name: inputs.targetCategoryName
      })
      log('Category created response', category)
      return category.id
    }
  }
}

async function updateDeployment({ environmentId }) {
  try {
    if (
      !inputs.deploymentVersionName &&
      !inputs.deploymentBuildNumber &&
      !inputs.deploymentDescription &&
      !inputs.deploymentIssueKeys &&
      !inputs.deploymentAttributes
    ) {
      return
    }

    const deployment = await golive.deploy(environmentId, {
      versionName: inputs.deploymentVersionName,
      buildNumber: inputs.deploymentBuildNumber,
      description: inputs.deploymentDescription,
      issueKeys: inputs.deploymentIssueKeys,
      attributes: inputs.deploymentAttributes
    })
    log('Deployment performed response', deployment)
  } catch (e) {
    if (e.statusCode !== 304) {
      throw e
    }
    log('Environment Deployment unchanged')
  }
}

async function updateStatus({ environmentId }) {
  if ((!environmentId && !inputs.environmentStatusName) || (!inputs.environmentStatusId && !inputs.environmentStatusName)) {
    return
  }

  try {
    const status = await golive.updateStatus(environmentId, {
      id: inputs.environmentStatusId,
      name: inputs.environmentStatusName
    })
    log('Environment Status changed response', status)
  } catch (e) {
    if (e.statusCode !== 304) {
      throw e
    }
    log('Environment Status unchanged')
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

let inputs: GoliveInputs
let golive: GoliveClient

async function run() {
  try {
    inputs = parseInput()
    golive = new GoliveClient({ serviceConnection: inputs.serviceConnection })

    const environmentId = await getTargetEnvironmentId()
    if (!environmentId) {
      throw new Error('Could not get a valid target environment')
    }
    await updateDeployment({ environmentId })
    await updateStatus({ environmentId })
    await updateEnvironment({ environmentId })
  } catch (err) {
    tl.error(err)
    tl.setResult(tl.TaskResult.Failed, err.message)
  }
}

run()
