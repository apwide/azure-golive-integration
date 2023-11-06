const { ExtensionSettings, TaskSettings } = require('../taskSettings')
const { execSync} = require('child_process')

const action = process.argv.length > 2 ? process.argv[2] : 'not-provided'

const { BUILD_ENV, TASK_NAME } = process.env
const extensionSetting = BUILD_ENV ? ExtensionSettings[BUILD_ENV] : undefined
const taskSetting = BUILD_ENV ? TaskSettings[TASK_NAME]?.[BUILD_ENV]: undefined

if (!extensionSetting) {
  throw new Error(`Unable to find an extension setting for BUILD_ENV: ${BUILD_ENV}`)
}

if (!taskSetting) {
  throw new Error(`Unable to find a task setting for TASK_NAME: ${TASK_NAME}`)
}

console.log('selected settings', extensionSetting)
const TASK_ID = taskSetting.TaskGuid

console.log('action', action)

switch (action) {
  case 'clean:task':
    execSync(`npm run do:clean:task`, { env: { ...process.env, TASK_ID }, stdio: 'inherit' })
    break
  case 'create:task':
    execSync(`npm run do:create:task`, { env: { ...process.env, TASK_ID }, stdio: 'inherit' })
    break
  default:
    throw new Error(`Unknown golive action ${action}`)
}
