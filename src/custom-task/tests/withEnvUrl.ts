import tmrm = require("azure-pipelines-task-lib/mock-run");
import path = require("path");
import { MockRequest } from "./utils/MockRequest";

const taskPath = path.join(__dirname, "..", "main.js");
const tmr: tmrm.TaskMockRunner = new tmrm.TaskMockRunner(taskPath);

tmr.setInput("serviceConnection", "ID1");
tmr.setInput("targetEnvironmentId", "111");
tmr.setInput("environmentUrl", "https://my-new-url.com");

const mockedRequest = new MockRequest();

mockedRequest.updatedEnvironment = {id: 111, url: "https://my-new-url.com"};

tmr.registerMock("request-promise-native", mockedRequest);

tmr.run();
