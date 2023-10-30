import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import NullAzureClient from './utils/MockAzureClient'

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setInput('targetEnvironmentId', '113')

tmr.registerMock('./AzureClient', NullAzureClient)

tmr.run()
