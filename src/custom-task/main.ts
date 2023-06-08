import tl = require("azure-pipelines-task-lib/task");
import request = require("request-promise-native");

async function run() {
  try {
    const environmentId: string = tl.getInput("targetEnvironmentId", true);
    const goliveConnection: string = tl.getInput("serviceConnection", true);
    const goliveBaseUrl = tl.getEndpointUrl(goliveConnection, false);
    const apiToken = tl.getEndpointAuthorizationParameter(goliveConnection, "apitoken", false);

    tl.debug("goliveConnection: " + goliveConnection);
    tl.debug("goliveBaseUrl: " + goliveBaseUrl);
    tl.debug("apitoken: " + apiToken);

    const versionName: string = tl.getInput("deploymentVersionName", true);
    const buildNumber: string | undefined = tl.getInput("deploymentBuildNumber", false);
    const description: string | undefined = tl.getInput("deploymentDescription", false);
    const issueKeys: string | undefined = tl.getInput("deploymentIssueKeys", false);

    request.put({
        url: goliveBaseUrl + "deployment?environmentId=" + environmentId,
        strictSSL: false,
        auth: {
          bearer: apiToken
        },
        json: {
          versionName,
          buildNumber,
          description,
          issueKeys: issueKeys ? issueKeys.replace(/\s/g, "").split(",") : []
        }
      },
      (err, httpResponse, body) => {
        if (err) {
          tl.debug("error: " + err);
          console.error("error: ", err);
          throw new Error(err);
        }
        tl.debug("httpResponse: " + httpResponse);
        console.log("httpResponse", httpResponse);
        tl.debug(`body: ${body}`);
        console.error("body: ", body);
      });

    console.log("Golive environmentId", environmentId);
  } catch (err) {
    // @ts-ignore
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
