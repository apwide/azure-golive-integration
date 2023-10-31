import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import mockFetch = require('./utils/mockFetch')
import { mockAzureClient } from './utils/mockAzureClient'

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('targetEnvironmentName', 'my unknown name')

tmr.registerMock(
  'node-fetch',
  mockFetch({
    post: () => ({ environments: [] })
  })
)
tmr.registerMock('./AzureClient', mockAzureClient())

tmr.run()
