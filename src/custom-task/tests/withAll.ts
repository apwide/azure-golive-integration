import tmrm = require("azure-pipelines-task-lib/mock-run");
import path = require("path");
import { MockRequest } from "./utils/MockRequest";

const taskPath = path.join(__dirname, "..", "main.js");
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("serviceConnection", "ID1");
tmr.setInput("targetEnvironmentName", "new app new cat");
tmr.setInput("targetApplicationName", "app");
tmr.setInput("targetCategoryName", "cat");
tmr.setInput("targetAutoCreate", "true");
tmr.setInput("deploymentVersionName", "ECOM 1.2.3.4");
tmr.setInput("environmentStatusId", "23");
tmr.setInput("environmentUrl", "https://my-new-url.com");

const mockedRequest = new MockRequest();
mockedRequest.foundEnvironments = [];
mockedRequest.foundApplications = [];
mockedRequest.createdApplication = {name: "app", id: "12"};
mockedRequest.foundCategories = [];
mockedRequest.createdCategory = {name: "cat", id: "13"};
mockedRequest.createdEnvironment = {
  id: 333,
  name: "new app new cat",
  application: {
    id: 12
  },
  category: {
    id: 13
  }
};
mockedRequest.updatedDeployment = {message: "Deployed version updated to ECOM 1.2.3.4"};
mockedRequest.updatedEnvironmentStatus = {status: {id: 23}};
mockedRequest.updatedEnvironment = {id: 333, url: "https://my-new-url.com"};

tmr.registerMock("request-promise-native", mockedRequest);

tmr.run();
