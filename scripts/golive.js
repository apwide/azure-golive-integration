const Settings = require('../taskSettings')
const { execSync} = require('child_process')

const action = process.argv.length > 2 ? process.argv[2] : 'not-provided'

const { BUILD_ENV } = process.env
const setting = BUILD_ENV ? Settings[BUILD_ENV] : undefined

if (!setting) {
  throw new Error(`Unable to find a setting for BUILD_ENV: ${BUILD_ENV}`)
}

console.log('selected settings', setting)
const TASK_ID = setting.TaskGuid

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
