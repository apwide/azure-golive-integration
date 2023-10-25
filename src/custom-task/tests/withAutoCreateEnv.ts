import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import { MockRequest } from './utils/MockRequest'

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('targetEnvironmentName', 'new app new cat')
tmr.setInput('targetApplicationName', 'app')
tmr.setInput('targetCategoryName', 'cat')
tmr.setInput('targetAutoCreate', 'true')

const mockedRequest = new MockRequest()
mockedRequest.foundEnvironments = []
mockedRequest.foundApplications = [{ name: 'app', id: '12' }]
mockedRequest.foundCategories = [{ name: 'cat', id: '13' }]
mockedRequest.createdEnvironment = {
  id: 333,
  name: 'new app new cat',
  application: {
    id: 12
  },
  category: {
    id: 13
  }
}

tmr.registerMock('request-promise-native', mockedRequest)

tmr.run()
