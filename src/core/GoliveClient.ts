import tl = require('azure-pipelines-task-lib/task')
import { debug, toBase64 } from './utils'
import fetch from 'node-fetch'
import * as https from 'https'
import { tokenHeaders } from './restUtils'

function removeUndefined(payload: any): any {
  Object.keys(payload).forEach((key) => {
    payload[key] === undefined && delete payload[key]
    if (typeof payload[key] === 'object') {
      removeUndefined(payload[key])
    }
  })
  return payload
}

export type DeployedIssues = {
  issueKeys?: string[]
  jql?: string
  sendJiraNotification?: boolean
  noFixVersionUpdate?: boolean
  addDoneIssuesFixedInVersion?: boolean
}

export type EnvironmentInfo = {
  url?: string
  attributes?: Record<string, string>
}

export type DeploymentInfo = {
  versionName?: string
  description?: string
  buildNumber?: string
  deployedDate?: string
  attributes?: Record<string, string>
  issues?: DeployedIssues
}

export type EnvironmentInformationRequest = {
  environmentSelector: {
    environment: CreatableNamedReference
    application?: CreatableNamedReference
    category?: CreatableNamedReference
  }
  environment?: EnvironmentInfo
  deployment?: DeploymentInfo
  status?: NamedReference
}

export type EnvironmentInformationResponse = {
  environment: NamedReference
  deployment?: DeploymentInfoDetail
  status?: NamedReference
}

export type DeploymentInfoDetail = {
  id: number
  environmentId: number
  versionName?: string
  versionId?: string
  description?: string
  buildNumber?: string
  deployer: string
  deployedOn: string
  issueKeys?: string[] // TODO should be removed
  attributes?: Record<string, string>
}

export type ReleasedIssues = {
  issueKeys?: string[]
  jql?: string
  sendJiraNotification?: boolean
}

export type ReleaseInformationRequest = {
  application: NamedReference
  versionName: string
  versionDescription?: string
  startDate?: string
  releaseDate?: string
  released?: boolean
  issues?: ReleasedIssues
  sendJiraNotification?: boolean
  preventFixVersionUpdate?: boolean
}

export type ReleaseInformationResponse = {
  versionId: number
  versionName: string
  versionDescription?: string
  startDate: string
  releaseDate?: string
  released: boolean
  fixedIssues?: string[]
}

export type DeploymentRequest = {
  versionName?: string
  buildNumber?: string
  description?: string
  issueKeys?: string[]
  attributes?: Record<string, string>
}

export type EnvironmentCreateRequest = {
  name: string
  application: {
    id: string
  }
  category: {
    id: string
  }
}

export type EnvironmentUpdateRequest = {
  url?: string
  attributes?: Record<string, string>
}

export type NamedReference = {
  id?: string
  name?: string
}

export type CreatableNamedReference = {
  id?: string
  name?: string
  autoCreate?: boolean
}

export class GoliveClient {
  private readonly golive: any

  constructor({ taskId, serviceConnection }: { taskId: string; serviceConnection: string }) {
    const goliveBaseUrl = tl.getEndpointUrl(serviceConnection, false)
    const serverEndpointAuth = tl.getEndpointAuthorization(serviceConnection, false)
    const username = serverEndpointAuth.parameters.username
    const password = serverEndpointAuth.parameters.password
    const apiToken = serverEndpointAuth.parameters.apitoken
    const authenticationScheme = serverEndpointAuth.scheme
    const agent = new https.Agent({ rejectUnauthorized: false })
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'accept': 'application/json',
      'user-agent': `apwide-golive-azure (${taskId})`,
      ...tokenHeaders(apiToken),
      'Authorization': authenticationScheme === 'Token' ? 'Bearer ' + apiToken : 'Basic ' + toBase64(`${username}:${password}`)
    }

    debug(`goliveConnection: ${serviceConnection}`)
    debug(`goliveBaseUrl: ${goliveBaseUrl}`)
    debug(`apitoken: ${apiToken}`)
    debug(`username: ${username}`)
    debug(`password: ${password}`)
    debug(`headers: ${JSON.stringify(headers)}`)

    this.golive = async (path, request = {}): Promise<any> => {
      const baseUrl = goliveBaseUrl.endsWith('/') ? goliveBaseUrl.substring(0, goliveBaseUrl.length - 1) : goliveBaseUrl
      const response = await fetch(`${baseUrl}${path}`, {
        ...request,
        agent,
        headers
      })
      if (response.status === 304) {
        // not modified so return null
        return null
      }
      // if (response.status === 404) {
      //   // not found so null
      //   return null
      // }
      debug(`status of call to ${path} was ${response.status}`)
      if (!response.ok) {
        throw new Error(await response.text())
      } else {
        const body = await response.text()
        debug(`response payload of call to ${path} was: ${body}`)
        return body && body.length ? JSON.parse(body) : undefined
      }
    }
  }

  async getEnvironmentByName(environmentName: string): Promise<any | null> {
    const response = await this.golive('/environments/search/paginated', {
      method: 'POST',
      body: JSON.stringify({
        criteria: [
          {
            name: 'environmentName',
            values: [environmentName]
          }
        ]
      })
    })
    return response?.environments?.find((env) => env.name === environmentName) || null
  }

  async getApplicationByName(applicationName): Promise<any | null> {
    const apps = (await this.golive('/applications')) || []
    return apps.find((app) => app.name === applicationName) || null
  }

  async getCategoryByName(categoryName): Promise<any | null> {
    const cats = (await this.golive('/categories')) || []
    return cats.find((cat) => cat.name === categoryName) || null
  }

  async createCategory(category: any) {
    return this.golive('/category', {
      method: 'POST',
      body: JSON.stringify(removeUndefined(category))
    })
  }

  async createApplication(application: any) {
    return this.golive('/application', {
      method: 'POST',
      body: JSON.stringify(removeUndefined(application))
    })
  }

  async createEnvironment(environment: EnvironmentCreateRequest) {
    return this.golive('/environment', {
      method: 'POST',
      body: JSON.stringify(removeUndefined(environment))
    })
  }

  async updateStatus(environmentId: string, status: NamedReference) {
    return this.golive(`/status-change?environmentId=${environmentId}`, {
      method: 'PUT',
      body: JSON.stringify(status)
    })
  }

  async updateEnvironment(environmentId: string, environment: EnvironmentUpdateRequest) {
    return this.golive(`/environment/${environmentId}`, {
      method: 'PUT',
      body: JSON.stringify(removeUndefined(environment))
    })
  }

  async deploy(environmentId: string, deployment: DeploymentRequest) {
    return this.golive(`/deployment?environmentId=${environmentId}`, {
      method: 'PUT',
      body: JSON.stringify(removeUndefined(deployment))
    })
  }

  async sendReleaseInfo(info: ReleaseInformationRequest): Promise<ReleaseInformationResponse> {
    return this.golive('/version', {
      method: 'POST',
      body: JSON.stringify(removeUndefined(info))
    })
  }

  async sendEnvironmentInfo(info: EnvironmentInformationRequest): Promise<EnvironmentInformationResponse> {
    return this.golive('/environment/information', {
      method: 'POST',
      body: JSON.stringify(removeUndefined(info))
    })
  }
}
