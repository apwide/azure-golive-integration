import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import NullAzureClient from './utils/MockAzureClient'
import mockFetch = require('./utils/mockFetch')

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('targetEnvironmentId', '111')
tmr.setInput('deploymentVersionName', 'ECOM 1.2.3.4')

tmr.registerMock(
  'node-fetch',
  mockFetch({
    put() {
      return { message: 'Deployed version updated to ECOM 1.2.3.4' }
    }
  })
)
tmr.registerMock('./AzureClient', NullAzureClient)

tmr.run()
