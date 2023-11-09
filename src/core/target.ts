import { GoliveClient } from './GoliveClient'
import { log } from './utils'

type EnvironmentSelectorInput = {
  targetAutoCreate?: boolean
  targetEnvironmentId?: string
  targetEnvironmentName?: string
  targetApplicationId?: string
  targetApplicationName?: string
  targetCategoryId?: string
  targetCategoryName?: string
}

type CategorySelectorInput = {
  targetAutoCreate?: boolean
  targetCategoryId?: string
  targetCategoryName?: string
}

type ApplicationSelectorInput = {
  targetAutoCreate?: boolean
  targetApplicationId?: string
  targetApplicationName?: string
}

export async function getTargetEnvironmentId(golive: GoliveClient, inputs: EnvironmentSelectorInput): Promise<string> {
  if (inputs.targetEnvironmentId) {
    return inputs.targetEnvironmentId
  }
  if (!inputs.targetEnvironmentName?.length) {
    throw new Error('Could not get a valid target environment')
  }
  const environment = await golive.getEnvironmentByName(inputs.targetEnvironmentName)
  log('Found environment', environment)
  if (environment) {
    return environment.id
  }
  if (inputs.targetAutoCreate) {
    const applicationId = await getTargetApplicationId(golive, inputs)
    const categoryId = await getTargetCategoryId(golive, inputs)
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
    return environment.id
  } else {
    throw new Error('Could not get a valid target environment')
  }
}

export async function getTargetApplicationId(
  golive: GoliveClient,
  { targetApplicationId, targetApplicationName, targetAutoCreate }: ApplicationSelectorInput
): Promise<string> {
  if (targetApplicationId) {
    return targetApplicationId
  }

  if (!targetApplicationName?.length) {
    throw new Error('Not able to identify application because none of targetApplicationId/targetApplicationName have been provided')
  }

  const application = await golive.getApplicationByName(targetApplicationName)
  log('Found application', application)
  if (application) {
    return application.id
  }
  if (targetAutoCreate) {
    log(`Create application with name ${targetApplicationName}`)
    const application = await golive.createApplication({
      name: targetApplicationName
    })
    log('Application created response', application)
    return application.id
  }
}

export async function getTargetCategoryId(
  golive: GoliveClient,
  { targetCategoryId, targetCategoryName, targetAutoCreate }: CategorySelectorInput
): Promise<string> {
  if (targetCategoryId) {
    return targetCategoryId
  }

  if (!targetCategoryName?.length) {
    throw new Error('Not able to identify category because none of targetCategoryId/targetCategoryName have been provided')
  }

  const category = await golive.getCategoryByName(targetCategoryName)
  log('Found category', category)
  if (category) {
    return category.id
  }
  if (targetAutoCreate) {
    log(`Create category with name ${targetCategoryName}`)
    const category = await golive.createCategory({
      name: targetCategoryName
    })
    log('Category created response', category)
    return category.id
  }
}
