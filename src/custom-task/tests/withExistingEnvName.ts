import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import mockFetch = require('../../tests/mockFetch')
import { mockAzureClient } from '../../tests/mockAzureClient'

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('targetEnvironmentName', 'my environment name')

tmr.registerMock(
  'node-fetch',
  mockFetch({
    post: () => ({ environments: [{ id: 456, name: 'my environment name' }] })
  })
)
tmr.registerMock('../core/AzureClient', mockAzureClient())

tmr.run()
