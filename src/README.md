# What is Apwide Golive for Jira?

Apwide Golive is the game-changing solution for comprehensive test environment management.

Seamlessly integrated with your development and release processes, Apwide Golive empowers your teams to
deliver high-quality software with speed and confidence.
Apwide Golive provides a centralized dashboard for visualizing and tracking environment usage, resource allocation, and availability right in Jira.

With integrated notifications and approvals in Jira, stakeholders stay informed and can provide quick feedback, reducing delays and accelerating the testing
process.

Learn more about Apwide Golive: https://www.apwide.com

# Benefits of the Apwide Golive Azure DevOps Marketplace Extension

With the Apwide Golive and Azure extension, you can leverage the robust capabilities of Azure DevOps and combine them with the comprehensive test environment
management features of Apwide Golive for Jira.

This integration enables you to easily connect your Azure DevOps projects with Apwide Golive. Deployments and relevant environment information required by testers, release managers,... and other teams,
are automatically pushed to Apwide Golive from your Azure DevOps pipelines.

# Connect your Azure Project with Golive

Go to your Project Settings/Service Connections to connect to different instances of Golive:

![CreateNewServiceConnection.png](images/CreateNewServiceConnection.png)

Follow instructions to properly configure and verify your connection parameters:

![ApwideGoliveAzureServiceConnection.png](images/ApwideGoliveAzureServiceConnection.png)

# Add custom Golive tasks to your pipelines

You can configure new tasks to your pipelines with the graphical assistant:

![AddGolivePipelineTaskWithAssistant.png](images/AddGolivePipelineTaskWithAssistant.png)

The graphical assistant can also be used in “Release” pipelines:

![AddGoliveTaskToReleasePipeline.png](images/AddGoliveTaskToReleasePipeline.png)

# Apwide Golive Environment pipeline task

Use this task when your need to update deployment or to push any other information of your environments to Golive and Jira.

This is your “swiss knife” task to track your environments managed in Azure DevOps.

## Configure a new task using the graphical assistant

### Select the connection and specify the target Golive environment
After having selected the Servie Connection to connect with your Golive server, you have to identify the environment you want to update in Golive.

#### Automatically create target environment (if missing in Golive)
Select “auto create” option if you want to automatically create the environment based on the provided names if it does not exist yet in Golive:

![AzureCustomTaskTargetGoliveEnvironmentAutoCreate.png](images/AzureCustomTaskTargetGoliveEnvironmentAutoCreate.png)

#### Push information to an existing target environment
In order, to use an existing environment as target, simply let the “Environment Name” parameter empty and search for the Golive environment in the picker list:

![AzureCustomTaskTargetGoliveEnvironmentExisting.png](images/AzureCustomTaskTargetGoliveEnvironmentExisting.png)

### Push deployment information
If your pipeline is performing deployments, you can send the information of the performed deployment to Golive. All deployment information to push to Golive are set in the “Update Deployment” section:

![AzureCustomTaskDeploymentInformation.png.png](images/AzureCustomTaskDeploymentInformation.png.png)

The "Issue Keys from Commit" option enables the parsing of commit messages to identify the issue keys that should be added to the deployment.
The task will go through all commits made from the current job to the last successful job.

### Update Environment Status
If you want to update the status of the Golive environment (ex: when starting a deployment, after a deployment has been performed,…), open the “Update Status” section. Pick the desired status or type its name:

![UpdateGoliveEnvStatus.png](images/UpdateGoliveEnvStatus.png)

### Update Environment url and attributes
You can update and share other useful environment information managed by Azure DevOps pipelines in the “Update Environment” section.

![AzureCustomTaskEnvironmentInformation.png](images/AzureCustomTaskEnvironmentInformation.png)

## Configure a task using YAML
When working with yaml pipelines, the graphical assistant will generate yaml code that you can edit an re-use in other pipelines or in templates of pipeline.

Example of generated yaml:

```yaml
trigger:
- main

pool:
vmImage: "ubuntu-latest"

steps:
- task: ApwideGoliveSendEnvironmentInfos@1
  inputs:
  serviceConnection: 'apwide.atlassian.net'
  targetEnvironmentName: 'eCommerce Demo'
  targetAutoCreate: true
  targetApplicationName: 'eCommerce'
  targetCategoryName: 'Demo'
  deploymentVersionName: 'ECOM 2.3.4.34-SNAPSHOT'
  deploymentBuildNumber: '$(Build.BuildNumber)'
  deploymentDescription: |
  <b>✅ Job #$(Build.BuildId) - $(Build.DefinitionName)</b>
  Requested by: $(Build.RequestedFor)
  Branch: $(Build.SourceBranchName)
  environmentStatusId: '1'
  environmentUrl: 'https://ecommerce.staging.company.com'
  environmentAttributes: |
  {
  "OS" : "Linux",
  "Location" : "Switzerland",
  "Owner" : "me@company.com"
  }
```

## Contact us

The full documentation of this extension is available here:
* for Apwide Golive Cloud: https://golive.apwide.com/doc/latest/cloud/azure-devops-tfs-vsts
* for Apwide Golive for Jira Server / Data Center: https://golive.apwide.com/doc/latest/server-data-center/azure-devops-tfs-vsts

We are at your disposal if you have question or need support regarding Apwide Golive and this integration with Azure DevOps: https://www.apwide.com/support-documentation/



