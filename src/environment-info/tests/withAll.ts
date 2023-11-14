import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import mockFetch = require('../../tests/mockFetch')
import { mockAzureClient } from '../../tests/mockAzureClient'

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setVariableName('Build.BuildId', '1')
tmr.setVariableName('Build.SourceVersion', '1')

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('targetEnvironmentName', 'new app new cat')
tmr.setInput('targetApplicationName', 'app')
tmr.setInput('targetCategoryName', 'cat')
tmr.setInput('targetAutoCreate', 'true')
tmr.setInput('deploymentVersionName', 'ECOM 1.2.3.4')
tmr.setInput('environmentStatusId', '23')
tmr.setInput('environmentUrl', 'https://my-new-url.com')

tmr.registerMock('./AzureClient', mockAzureClient())
tmr.registerMock('node-fetch', mockFetch())

tmr.run()
