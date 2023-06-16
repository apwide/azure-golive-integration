import tmrm = require("azure-pipelines-task-lib/mock-run");
import path = require("path");

const taskPath = path.join(__dirname, "..", "main.js");
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("serviceConnection", "ID1");
tmr.setInput("targetEnvironmentId", "111");
tmr.setInput("deploymentVersionName", "ECOM 1.2.3.4");

const mockedRequest = {
  put: async () => {
    return {message: "Deployed version updated to ECOM 1.2.3.4"};
  }
};

tmr.registerMock("request-promise-native", mockedRequest);

tmr.run();
