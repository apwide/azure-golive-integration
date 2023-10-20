# azure-golive-integration

# <img height="128" src="./images/azure-pipelines.png" width="128"/> + <img height="128" src="images/golive.png" width="128"/>

## Introduction
This repository contains source code, documentation and scripts required to build and publish the Apwide Golive for Jira Azure DevOps extension: https://marketplace.visualstudio.com/items?itemName=Apwide.ApwideGoliveForJiraDev

## Build and publish the extension

1. Create a personal access token for the Azure Devops account where you would test run your task. Refer [this](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate?view=azure-devops) to learn how to create a personal access token.

2. Request to have permission on different Apwide project/organization (to upload task and so on such as Apwide Organization, its projects, being member of "Project Collection Administrators" organization group, having permission to access Apwide publisher)

1. Set following environment variables to enable inner loop commands-
    - `BUILD_ENV` = **development**
    - `ADO_PAT` - Your personal access token
    - `ADO_ACCOUNT_URI` - The default collection URI for your account *(eg. <https://dev.azure.com/{{name}})>*
    - `DEV_PUBLISHER` - Id of your publisher account

1. Run following commands to verify setup-
    1. `npm install` (Installs npm dependencies)
    1. `npm run dev` (Builds, packages and publishes the extension)

1. Refer to [package.json](./package.json) to see the list of all commands.

## Typical inner loop commands

| What changed? | Which NPM command to run? | What it does? |
| ------------- |:-------------:|:----- |
| Task implementation | `npm run dev:task` | Build, package and update custom task without updating extension *(Faster)* |
| Anything else | `npm run dev` | Build, package and publish full extension *(Slower)* |

## Known bugs & limitations
* you will not be able to publish the extension to the marketplace between 00:00 and 01:00 (AM)
* do not forget to set the environment variables correctly
* updates of some common resources may conflict when both "DEV" and "PROD" versions of the extension are installed to the same Azure DevOps organization

