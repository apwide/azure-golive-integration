import tmrm = require("azure-pipelines-task-lib/mock-run");
import path = require("path");
import {MockRequest} from "./utils/MockRequest";

const taskPath = path.join(__dirname, "..", "main.js");
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("serviceConnection", "ID1");
tmr.setInput("targetEnvironmentName", "my unknown name");

const mockedRequest = new MockRequest();
mockedRequest.post = async () => {
  return { environments: [] };
};

tmr.registerMock("request-promise-native", mockedRequest);

tmr.run();