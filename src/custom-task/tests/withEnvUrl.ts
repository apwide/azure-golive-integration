import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import mockFetch = require('./utils/mockFetch')
import { mockAzureClient } from './utils/mockAzureClient'

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('targetEnvironmentId', '111')
tmr.setInput('environmentUrl', 'https://my-new-url.com')

tmr.registerMock(
  'node-fetch',
  mockFetch({
    updatedEnvironment: { id: 111, url: 'https://my-new-url.com' }
  })
)
tmr.registerMock('./AzureClient', mockAzureClient())

tmr.run()
