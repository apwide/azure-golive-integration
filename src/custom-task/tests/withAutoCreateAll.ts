import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import NullAzureClient from './utils/MockAzureClient'
import mockFetch = require('./utils/mockFetch')

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('targetEnvironmentName', 'new app new cat')
tmr.setInput('targetApplicationName', 'app')
tmr.setInput('targetCategoryName', 'cat')
tmr.setInput('targetAutoCreate', 'true')

tmr.registerMock(
  'node-fetch',
  mockFetch({
    foundEnvironments: [],
    foundApplications: [],
    createdApplication: { name: 'app', id: '12' },
    foundCategories: [],
    createdCategory: { name: 'cat', id: '13' },
    createdEnvironment: {
      id: 333,
      name: 'new app new cat',
      application: {
        id: 12
      },
      category: {
        id: 13
      }
    }
  })
)
tmr.registerMock('./AzureClient', NullAzureClient)

tmr.run()
