import tl = require('azure-pipelines-task-lib/task')
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { getHandlerFromToken, WebApi } from 'azure-devops-node-api'
import { IBuildApi } from 'azure-devops-node-api/BuildApi'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { Build, BuildQueryOrder, BuildResult } from 'azure-devops-node-api/interfaces/BuildInterfaces'
import { GitVersionDescriptor, GitVersionType } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { log } from './utils'
import { Builds } from './Builds'

export class AzureClient {
  private readonly buildApi: IBuildApi
  private readonly gitApi: IGitApi
  private readonly projectId: string
  private readonly definitionId: number

  constructor(buildApi: IBuildApi, gitApi: IGitApi, projectId: string, definitionId: number) {
    this.buildApi = buildApi
    this.gitApi = gitApi
    this.projectId = projectId
    this.definitionId = definitionId
  }

  async getBuilds(): Promise<Builds> {
    return new Builds(await this.loadBuilds())
  }

  private async loadBuilds() {
    // const definition = await buildApi.getDefinition(projectId, definitionId)
    // const builds = await buildApi.getBuilds(projectId, [definition.id])
    return this.buildApi.getBuilds(
      this.projectId,
      [this.definitionId],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      BuildQueryOrder.FinishTimeDescending
    )
  }

  async getChanges(buildId: number) {
    return this.buildApi.getBuildChanges(this.projectId, buildId)
  }

  async getChangesBetween(fromBuildId: number, toBuildId: number) {
    // const changes = await buildApi.getBuildChanges(projectId, fromBuildId, undefined, undefined, true)
    // changes.forEach((change) => {
    //   log(`change ${change.id}-${change.type} done on ${change.timestamp} had message ${change.message}`)
    // })
    return this.buildApi.getChangesBetweenBuilds(this.projectId, fromBuildId, toBuildId)
  }

  async getCommits(fromCommitId: string, toCommitId: string) {
    const repositoryId = tl.getVariable('Build.Repository.Id')
    log(`Search commits in repository id ${repositoryId} for ${fromCommitId}..${toCommitId}`)
    if (fromCommitId === toCommitId) {
      return (await this.gitApi.getCommits(repositoryId, { fromCommitId, toCommitId })) || []
    } else {
      const itemVersion: GitVersionDescriptor = {
        version: fromCommitId,
        versionType: GitVersionType.Commit
      }
      const compareVersion: GitVersionDescriptor = {
        version: toCommitId,
        versionType: GitVersionType.Commit
      }
      return (await this.gitApi.getCommits(repositoryId, { itemVersion, compareVersion })) || []
    }
  }
}

export async function getAzureClient() {
  const endpointUrl: string = tl.getVariable('System.TeamFoundationCollectionUri')
  const accessToken: string = tl.getEndpointAuthorizationParameter('SYSTEMVSSCONNECTION', 'AccessToken', false)
  const credentialHandler: IRequestHandler = getHandlerFromToken(accessToken)
  const webApi: WebApi = new WebApi(endpointUrl, credentialHandler)
  const buildApi = await webApi.getBuildApi()
  const gitApi = await webApi.getGitApi()
  const projectId = tl.getVariable('System.TeamProjectId')
  const definitionId = parseInt(tl.getVariable('System.DefinitionId'))
  return new AzureClient(buildApi, gitApi, projectId, definitionId)
}
