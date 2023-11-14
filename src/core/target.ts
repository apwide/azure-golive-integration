import { GoliveClient } from './GoliveClient'
import { log } from './utils'

type ApplicationSelectorInput = {
  targetAutoCreate?: boolean
  targetApplicationId?: string
  targetApplicationName?: string
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
