import tl = require('azure-pipelines-task-lib/task')
import { debug } from './utils'
import request = require('request-promise-native')

function toBase64(value: string) {
  return Buffer.from(value).toString('base64')
}

function removeUndefined(payload: any): any {
  Object.keys(payload).forEach((key) => payload[key] === undefined && delete payload[key])
  return payload
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

export class GoliveClient {
  private readonly golive: any

  constructor({ serviceConnection }: { serviceConnection: string }) {
    const goliveBaseUrl = tl.getEndpointUrl(serviceConnection, false)
    const serverEndpointAuth = tl.getEndpointAuthorization(serviceConnection, false)
    const username = serverEndpointAuth.parameters.username
    const password = serverEndpointAuth.parameters.password
    const apiToken = serverEndpointAuth.parameters.apitoken
    const authenticationScheme = serverEndpointAuth.scheme
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      'Authorization': authenticationScheme === 'Token' ? 'Bearer ' + apiToken : 'Basic ' + toBase64(`${username}:${password}`)
    }

    debug(`goliveConnection: ${serviceConnection}`)
    debug(`goliveBaseUrl: ${goliveBaseUrl}`)
    debug(`apitoken: ${apiToken}`)
    debug(`username: ${username}`)
    debug(`password: ${password}`)
    debug(`headers: ${JSON.stringify(headers)}`)

    this.golive = request.defaults({
      baseUrl: goliveBaseUrl,
      strictSSL: false,
      headers
    })
  }

  async getEnvironmentByName(environmentName: string): Promise<any | null> {
    const response = await this.golive.post({
      url: '/environments/search/paginated',
      json: {
        criteria: [
          {
            name: 'environmentName',
            values: [environmentName]
          }
        ]
      }
    })
    return response?.environments?.find((env) => env.name === environmentName) || null
  }

  async getApplicationByName(applicationName): Promise<any | null> {
    const response = await this.golive.get({ url: '/applications' })
    return JSON.parse(response).find((app) => app.name === applicationName) || null
  }

  async getCategoryByName(categoryName): Promise<any | null> {
    const response = await this.golive.get({ url: '/categories' })
    return JSON.parse(response)?.find((cat) => cat.name === categoryName) || null
  }

  async createCategory(category: any) {
    return this.golive.post({
      url: '/category',
      json: removeUndefined(category)
    })
  }

  async createApplication(application: any) {
    return this.golive.post({
      url: '/application',
      json: removeUndefined(application)
    })
  }

  async createEnvironment(environment: EnvironmentCreateRequest) {
    return this.golive.post({
      url: '/environment',
      json: removeUndefined(environment)
    })
  }

  async updateStatus(environmentId: string, status: NamedReference) {
    return this.golive.put({
      url: `/status-change?environmentId=${environmentId}`,
      json: status
    })
  }

  async updateEnvironment(environmentId: string, environment: EnvironmentUpdateRequest) {
    return this.golive.put({
      url: `/environment/${environmentId}`,
      json: removeUndefined(environment)
    })
  }

  async deploy(environmentId: string, deployment: DeploymentRequest) {
    // TODO delete undefined keys ?
    return this.golive.put({
      url: `/deployment?environmentId=${environmentId}`,
      json: removeUndefined(deployment)
    })
  }
}
