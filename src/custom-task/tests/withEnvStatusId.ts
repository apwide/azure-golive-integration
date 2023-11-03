import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import mockFetch = require('../../tests/mockFetch')
import { mockAzureClient } from '../../tests/mockAzureClient'

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('targetEnvironmentId', '111')
tmr.setInput('environmentStatusId', '23')

tmr.registerMock(
  'node-fetch',
  mockFetch({
    updatedEnvironmentStatus: { status: { id: 23 } }
  })
)
tmr.registerMock('../core/AzureClient', mockAzureClient())

tmr.run()
