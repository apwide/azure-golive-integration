import tmrm = require('azure-pipelines-task-lib/mock-run')
import path = require('path')
import mockFetch = require('../../../../tests/mockFetch')
import { mockAzureClient } from '../../../../tests/mockAzureClient'

const taskPath = path.join(__dirname, '..', 'main.js')
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath)

tmr.setVariableName('Build.BuildId', '1')
tmr.setVariableName('Build.SourceVersion', '1')

tmr.setInput('serviceConnection', 'ID1')
tmr.setInput('versionName', 'ECOM-11.2')

tmr.registerMock('./AzureClient', mockAzureClient())
tmr.registerMock('node-fetch', mockFetch())

tmr.run()
