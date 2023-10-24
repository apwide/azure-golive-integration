import tl = require("azure-pipelines-task-lib/task");
import request = require("request-promise-native");

async function run() {

  try {
    const goliveConnection: string = tl.getInput("serviceConnection", true);
    const goliveBaseUrl = tl.getEndpointUrl(goliveConnection, false);
    const serverEndpointAuth = tl.getEndpointAuthorization(goliveConnection, false);
    const username = serverEndpointAuth.parameters.username;
    const password = serverEndpointAuth.parameters.password;
    const apiToken = serverEndpointAuth.parameters.apitoken;
    const authenticationScheme = serverEndpointAuth.scheme;
    const autoCreate = !!tl.getInput("targetAutoCreate", false);
    const headers: Record<string, string> = {"content-type": "application/json"};
    if (authenticationScheme === "Token") {
      headers.Authorization = "Bearer " + apiToken;
    } else {
      headers.Authorization = "Basic " + new Buffer(username + ":" + password).toString("base64");
    }

    tl.debug("goliveConnection: " + goliveConnection);
    tl.debug("goliveBaseUrl: " + goliveBaseUrl);
    tl.debug("apitoken: " + apiToken);
    tl.debug("username: " + username);
    tl.debug("password: " + password);
    tl.debug("headers: " + JSON.stringify(headers));

    const golive = request.defaults({
      baseUrl: goliveBaseUrl,
      strictSSL: false,
      headers
    });

    async function getTargetEnvironmentId(): Promise<string> {
      const targetEnvironmentId: string = tl.getInput("targetEnvironmentId", false);
      if (targetEnvironmentId) {
        return targetEnvironmentId;
      }

      const name: string = tl.getInput("targetEnvironmentName", false);
      if (name) {
        const environmentId = await getEnvironmentIdByName(name);
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
          return await createEnvironmentId({name, categoryId, applicationId});
        }
      }
    }

    async function getTargetApplicationId(): Promise<string> {
      const targetApplicationId: string = tl.getInput("targetApplicationId", false);
      if (targetApplicationId) {
        return targetApplicationId;
      }

      const name: string = tl.getInput("targetApplicationName", false);
      if (name) {
        const applicationId = await getApplicationIdByName(name);
        if (applicationId) {
          return applicationId;
        }
        if (autoCreate) {
          return await createApplicationId({name});
        }
      }
    }

    async function getTargetCategoryId(): Promise<string> {
      const targetEnvironmentId: string = tl.getInput("targetEnvironmentId", false);
      if (targetEnvironmentId) {
        return targetEnvironmentId;
      }

      const name: string = tl.getInput("targetCategoryName", false);
      if (name) {
        const categoryId = await getCategoryIdByName(name);
        if (categoryId) {
          return categoryId;
        }
        if (autoCreate) {
          return await createCategoryId({name});
        }
      }
    }

    async function createEnvironmentId({name, applicationId, categoryId}): Promise<string | undefined> {
      const json = {
        name,
        application: {
          id: applicationId
        },
        category: {
          id: categoryId
        }
      };
      console.log(`Create environment with application ${applicationId}, category ${categoryId} and name ${name}`);
      const response = await golive.post({
        url: "/environment",
        json
      });
      tl.debug("Environment created response: " + response);
      console.log("Environment created response", response);
      return response?.id;
    }

    async function createApplicationId({name}): Promise<string | undefined> {
      console.log(`Create application with name ${name}`);
      const json = { name };
      const response = await golive.post({
        url: "/application",
        json
      });
      tl.debug("Application created response: " + response);
      console.log("Application created response", response);
      return response?.id;
    }

    async function createCategoryId({name}): Promise<string | undefined> {
      console.log(`Create category with name ${name}`);
      const json = { name };
      const response = await golive.post({
        url: "/category",
        json
      });
      tl.debug("Category created response: " + response);
      console.log("Category created response", response);
      return response?.id;
    }

    async function getEnvironmentIdByName(environmentName): Promise<string | undefined> {
      const response = await golive.post({
        url: "/environments/search/paginated",
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
      const response = await golive.get({ url: "/applications" });
      const application = JSON.parse(response).find(app => app.name === applicationName);
      tl.debug("Found application: " + application);
      console.log("found application", application);
      return application?.id;
    }

    async function getCategoryIdByName(categoryName): Promise<string | undefined> {
      const response = await golive.get({ url: "/categories" });
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

        const response = await golive.put({
          url: `/deployment?environmentId=${environmentId}`,
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
      if (!environmentStatusId && !environmentStatusName) {
        return;
      }

      try {
        const json = {
          id: environmentStatusId,
          name: environmentStatusName
        };
        const response = await golive.put({
          url: `/status-change?environmentId=${environmentId}`,
          json
        });
        tl.debug("Environment Status changed response: " + response);
        console.log("Environment Status changed response", response);
      } catch (e) {
        if (e.statusCode !== 304) {
          throw e;
        }
        console.log("Environment Status unchanged");
      }
    }

    function parseAttributes(unParsedAttributes: string): Record<string, string> {
      try {
        return JSON.parse(unParsedAttributes);
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

      const response = await golive.put({
        url: `/environment/${environmentId}`,
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

  } catch (err) {
    tl.error(err);
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
