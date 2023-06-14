import { EndpointAuthorization } from "azure-pipelines-task-lib";
import tl = require("azure-pipelines-task-lib/task");
import request = require("request-promise-native");

async function run() {
  try {
    const goliveConnection: string = tl.getInput("serviceConnection", true);
    const goliveBaseUrl = tl.getEndpointUrl(goliveConnection, false);
    const authenticationScheme = tl.getEndpointAuthorizationScheme(goliveConnection, false);
    const apiToken = tl.getEndpointAuthorizationParameter(goliveConnection, "apitoken", true);
    const username = tl.getEndpointAuthorizationParameter(goliveConnection, "username", true);
    const password = tl.getEndpointAuthorizationParameter(goliveConnection, "password", true);
    const autoCreate: boolean = !!tl.getInput("targetAutoCreate", false);

    tl.debug("goliveConnection: " + goliveConnection);
    tl.debug("goliveBaseUrl: " + goliveBaseUrl);
    tl.debug("apitoken: " + apiToken);
    tl.debug("username: " + username);
    tl.debug("password: " + password);

    const headers: any = {"content-type": "application/json"};
    if (authenticationScheme === "Token") {
      headers.Authorization = "Bearer " + apiToken;
    } else {
      headers.Authorization = "Basic " + new Buffer(username + ":" + password).toString("base64");
    }

    tl.debug("headers: " + JSON.stringify(headers));

    async function getTargetEnvironmentId(): Promise<string> {
      const targetEnvironmentId: string = tl.getInput("targetEnvironmentId", false);
      if (targetEnvironmentId) {
        return targetEnvironmentId;
      }

      const environmentName: string = tl.getInput("targetEnvironmentName", false);
      if (environmentName) {
        const environmentId = await getEnvironmentIdByName(environmentName);
        if (environmentId) {
          return environmentId;
        }
        if (autoCreate) {
          const applicationId = await getTargetApplicationId();
          if (!applicationId) {
            return;
          }
          const categoryId = await getTargetCategoryId();
          if (!categoryId) {
            return;
          }
          return await createEnvironmentId({name: environmentName, categoryId, applicationId});
        }
      }
    }

    async function getTargetApplicationId(): Promise<string> {
      const targetApplicationId: string = tl.getInput("targetApplicationId", false);
      if (targetApplicationId) {
        return targetApplicationId;
      }

      const applicationName: string = tl.getInput("targetApplicationName", false);
      if (applicationName) {
        const applicationId = await getApplicationIdByName(applicationName);
        if (applicationId) {
          return applicationId;
        }
        if (autoCreate) {
          return await createApplicationId({name: applicationName});
        }
      }
    }

    async function getTargetCategoryId(): Promise<string> {
      const targetEnvironmentId: string = tl.getInput("targetEnvironmentId", false);
      if (targetEnvironmentId) {
        return targetEnvironmentId;
      }

      const categoryName: string = tl.getInput("targetCategoryName", false);
      if (categoryName) {
        const categoryId = await getCategoryIdByName(categoryName);
        if (categoryId) {
          return categoryId;
        }
        if (autoCreate) {
          return await createCategoryId({name: categoryName});
        }
      }
    }

    async function createEnvironmentId({name, applicationId, categoryId}): Promise<string | undefined> {
      const response = await request.post({
        url: goliveBaseUrl + "environment",
        strictSSL: false,
        headers,
        json: {
          name,
          application: {
            id: applicationId
          },
          category: {
            id: categoryId
          }
        }
      });
      tl.debug("Environment created response: " + response);
      console.log("Environment created response", response);
      return response?.id;
    }

    async function createApplicationId({name}): Promise<string | undefined> {
      const response = await request.post({
        url: goliveBaseUrl + "application",
        strictSSL: false,
        headers,
        json: {
          name
        }
      });
      tl.debug("Application created response: " + response);
      console.log("Application created response", response);
      return response?.id;
    }

    async function createCategoryId({name}): Promise<string | undefined> {
      const response = await request.post({
        url: goliveBaseUrl + "category",
        strictSSL: false,
        headers,
        json: {
          name
        }
      });
      tl.debug("Category created response: " + response);
      console.log("Category created response", response);
      return response?.id;
    }

    async function getEnvironmentIdByName(environmentName): Promise<string | undefined> {
      const response = await request.post({
        url: goliveBaseUrl + "environments/search/paginated",
        strictSSL: false,
        headers,
        json: {
          criteria: [
            {
              name: "environmentName",
              values: [environmentName]
            },
          ]
        }
      });
      const environment = response?.environments?.find(env => env.name === environmentName);
      tl.debug("Found environment: " + environment);
      console.log("Found environment", environment);
      return environment?.id;
    }

    async function getApplicationIdByName(applicationName): Promise<string | undefined> {
      const response = await request.get({
        url: goliveBaseUrl + "applications",
        strictSSL: false,
        headers
      });
      const application = JSON.parse(response).find(app => app.name === applicationName);
      tl.debug("Found application: " + application);
      console.log("found application", application);
      return application?.id;
    }

    async function getCategoryIdByName(categoryName): Promise<string | undefined> {
      const response = await request.get({
        url: goliveBaseUrl + "categories",
        strictSSL: false,
        headers
      });
      const category = JSON.parse(response)?.find(cat => cat.name === categoryName);
      tl.debug("Found category: " + category);
      console.log("found application", category);
      return category?.id;
    }

    async function updateDeployment({environmentId}) {
      try {
        const versionName: string | undefined = tl.getInput("deploymentVersionName", false);
        const buildNumber: string | undefined = tl.getInput("deploymentBuildNumber", false);
        const description: string | undefined = tl.getInput("deploymentDescription", false);
        const issueKeys: string | undefined = tl.getInput("deploymentIssueKeys", false);
        const deploymentAttributes: string | undefined = tl.getInput("deploymentAttributes", false);

        if (!versionName && !buildNumber && !description && !issueKeys && !deploymentAttributes) {
          return;
        }

        const requestBody: any = {};

        if (versionName) {
          requestBody.versionName = versionName;
        }
        if (buildNumber) {
          requestBody.buildNumber = buildNumber;
        }
        if (description) {
          requestBody.description = description;
        }
        if (issueKeys) {
          requestBody.issueKeys = issueKeys.replace(/\s/g, "").split(",");
        }
        if (deploymentAttributes) {
          requestBody.attributes = parseAttributes(deploymentAttributes);
        }

        const response = await request.put({
          url: goliveBaseUrl + "deployment?environmentId=" + environmentId,
          strictSSL: false,
          headers,
          json: requestBody
        });
        tl.debug("Deployment performed response: " + response);
        console.log("Deployment performed response", response);
      } catch (e) {
        if (e.statusCode !== 304) {
          throw e;
        }
        tl.debug("Environment Deployment unchanged");
        console.log("Environment Deployment unchanged");
      }
    }

    async function updateStatus({environmentId}) {
      const environmentStatusId: string = tl.getInput("environmentStatusId", false);
      const environmentStatusName: string = tl.getInput("environmentStatusName", false);

      if (!environmentId && !environmentStatusName) {
        return;
      }
      try {
        const response = await request.put({
          url: goliveBaseUrl + "status-change?environmentId=" + environmentId,
          strictSSL: false,
          headers,
          json: {
            id: environmentStatusId,
            name: environmentStatusName
          }

        });
        tl.debug("Environment Status changed response: " + response);
        console.log("Environment Status changed response", response);
      } catch (e) {
        if (e.statusCode !== 304) {
          throw e;
        }
        tl.debug("Environment Status unchanged");
        console.log("Environment Status unchanged");
      }
    }

    function parseAttributes(unParsedAttributes: string): object {
      try {
        const jsonAttributes = JSON.parse(unParsedAttributes);
        return jsonAttributes;
      } catch (e) {
        throw new Error("Could not parse environment attributes: " + e);
      }
    }

    async function updateEnvironment({environmentId}) {
      const environmentUrl: string = tl.getInput("environmentUrl", false);
      const environmentAttributes: string = tl.getInput("environmentAttributes", false);

      if (!environmentUrl && !environmentAttributes) {
        return;
      }
      const requestBody: any = {};
      if (environmentUrl) {
        requestBody.url = environmentUrl;
      }
      if (environmentAttributes) {
        requestBody.attributes = parseAttributes(environmentAttributes);
      }

      const response = await request.put({
        url: goliveBaseUrl + "environment/" + environmentId,
        strictSSL: false,
        headers,
        json: requestBody
      });
      tl.debug("Environment updated response: " + response);
      console.log("Environment updated response", response);
    }

    async function runTask() {
      const environmentId = await getTargetEnvironmentId();
      if (!environmentId) {
        throw new Error("Could not get a valid target environment");
      }
      await updateDeployment({environmentId});
      await updateStatus({environmentId});
      await updateEnvironment({environmentId});
    }

    await runTask();

  } catch
    (err) {
    // @ts-ignore
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
