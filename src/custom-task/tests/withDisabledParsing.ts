import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import mockFetch = require('../../tests/mockFetch')
import { mockAzureClient } from '../../tests/mockAzureClient'

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('targetEnvironmentId', '1')
tmr.setInput('deploymentIssueKeysFromCommitHistory', 'false')

tmr.registerMock('node-fetch', mockFetch())
tmr.registerMock(
  './AzureClient',
  mockAzureClient({
    commits: [
      {
        comment: 'chore(vue): update composition API - TEM-10/TEM-100'
      },
      {
        comment: 'chore(vue): update 2 composition API - TEM-10/TEM-200'
      }
    ]
  })
)

tmr.run()
