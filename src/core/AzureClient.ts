import tl = require('azure-pipelines-task-lib/task')
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'
import { getHandlerFromToken, WebApi } from 'azure-devops-node-api'
import { IBuildApi } from 'azure-devops-node-api/BuildApi'
import { IGitApi } from 'azure-devops-node-api/GitApi'
import { BuildQueryOrder, Change } from 'azure-devops-node-api/interfaces/BuildInterfaces'
import { GitVersionDescriptor, GitVersionType } from 'azure-devops-node-api/interfaces/GitInterfaces'
import { debug, log } from './utils'
import { Builds } from './Builds'
import { IReleaseApi } from 'azure-devops-node-api/ReleaseApi'
import { Artifact, Release, ReleaseStatus, ReleaseWorkItemRef } from 'azure-devops-node-api/interfaces/ReleaseInterfaces'

function artifactLogInfo({ alias, type, sourceId }: Artifact): string {
  return `artifact '${alias}' of type '${type}' from source '${sourceId}'`
}

export class AzureClient {
  private readonly buildApi: IBuildApi
  private readonly gitApi: IGitApi
  private readonly releaseApi: IReleaseApi
  private readonly projectId: string
  private readonly definitionId: number

  constructor(buildApi: IBuildApi, gitApi: IGitApi, releaseApi: IReleaseApi, projectId: string, definitionId: number) {
    this.buildApi = buildApi
    this.gitApi = gitApi
    this.releaseApi = releaseApi
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

  async getChangesFromRelease(releaseId: number) {
    const release = await this.releaseApi.getRelease(this.projectId, releaseId)
    let previousRelease: Release
    if (release.releaseDefinition?.id) {
      const activeReleases =
        (await this.releaseApi.getReleases(this.projectId, release.releaseDefinition?.id, undefined, undefined, undefined, ReleaseStatus.Active)) || []
      previousRelease = activeReleases.find((activeRelease) => activeRelease.id < release.id) || undefined
    }

    debug(`release loaded for ${releaseId} : ${release}`)
    const changeMessages: string[] = [release.comment]

    log(`Search messages in artifacts work items and changes happened between release ${releaseId} and previous active release id ${previousRelease?.id} `)
    await Promise.all(
      (release.artifacts || []).map(async (artifact) => {
        try {
          debug(`loading release work items for '${artifactLogInfo(artifact)}'`)
          // eslint-disable-next-line max-len
          const artifactWorkItems =
            (await this.releaseApi.getReleaseWorkItemsRefs(this.projectId, releaseId, previousRelease?.id, undefined, artifact.alias)) || []
          changeMessages.push(...artifactWorkItems.map((workItem) => workItem.title))
          debug(`found ${artifactWorkItems.length} release work items for '${artifactLogInfo(artifact)}'`)
        } catch (error) {
          log(`not able to load release work items for '${artifactLogInfo(artifact)}' due to: ${error}`)
        }
        try {
          debug(`loading release changes messages for '${artifactLogInfo(artifact)}'`)
          const artifactChanges = (await this.releaseApi.getReleaseChanges(this.projectId, releaseId, previousRelease?.id, undefined, artifact.alias)) || []
          changeMessages.push(...artifactChanges.map((change) => change.message))
          debug(`found ${artifactChanges.length} release changes for '${artifactLogInfo(artifact)}'`)
        } catch (error) {
          log(`not able to load release changes for '${artifactLogInfo(artifact)}' due to: ${error}`)
        }
      })
    )

    return changeMessages.filter((m) => Boolean(m))
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
  const releaseApi = await webApi.getReleaseApi()
  const projectId = tl.getVariable('System.TeamProjectId')
  const definitionId = parseInt(tl.getVariable('System.DefinitionId'))
  return new AzureClient(buildApi, gitApi, releaseApi, projectId, definitionId)
}
