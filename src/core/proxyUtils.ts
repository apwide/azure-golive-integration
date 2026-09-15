import tl = require('azure-pipelines-task-lib/task')
import * as https from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { debug } from './utils'

type ProxySettings = {
  proxyUrl: string
  proxyUsername?: string
  proxyPassword?: string
}

function isBypassed(hostname: string, noProxy?: string): boolean {
  if (!noProxy) {
    return false
  }
  return noProxy
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .some((entry) => {
      if (entry === '*') {
        return true
      }
      const suffix = entry.startsWith('.') ? entry : `.${entry}`
      return hostname === entry || hostname.endsWith(suffix)
    })
}

// Fallback for self-hosted agents that rely on the standard HTTP_PROXY / HTTPS_PROXY / NO_PROXY
// environment variables instead of the agent proxy configuration (config.cmd/sh --proxyurl)
function getEnvProxySettings(requestUrl: string): ProxySettings | undefined {
  let hostname: string, protocol: string
  try {
    ;({ hostname, protocol } = new URL(requestUrl))
  } catch (e) {
    debug(`unable to parse url ${requestUrl}, skipping proxy environment variables lookup`)
    return undefined
  }
  const noProxy = process.env.NO_PROXY || process.env.no_proxy
  if (isBypassed(hostname, noProxy)) {
    return undefined
  }
  const proxyFromEnv = protocol === 'https:' ? process.env.HTTPS_PROXY || process.env.https_proxy : process.env.HTTP_PROXY || process.env.http_proxy
  if (!proxyFromEnv) {
    return undefined
  }
  const proxy = new URL(proxyFromEnv)
  return {
    proxyUrl: `${proxy.protocol}//${proxy.host}`,
    proxyUsername: proxy.username ? decodeURIComponent(proxy.username) : undefined,
    proxyPassword: proxy.password ? decodeURIComponent(proxy.password) : undefined
  }
}

function getProxySettings(requestUrl: string): ProxySettings | undefined {
  // 1. Azure Pipelines agent proxy configuration (Agent.ProxyUrl / config.cmd|sh --proxyurl)
  const agentProxyConfig = tl.getHttpProxyConfiguration(requestUrl)
  if (agentProxyConfig) {
    return {
      proxyUrl: agentProxyConfig.proxyUrl,
      proxyUsername: agentProxyConfig.proxyUsername,
      proxyPassword: agentProxyConfig.proxyPassword
    }
  }
  // 2. Standard proxy environment variables
  return getEnvProxySettings(requestUrl)
}

function withCredentials({ proxyUrl, proxyUsername, proxyPassword }: ProxySettings): string {
  if (!proxyUsername) {
    return proxyUrl
  }
  const url = new URL(proxyUrl)
  url.username = encodeURIComponent(proxyUsername)
  url.password = proxyPassword ? encodeURIComponent(proxyPassword) : ''
  return url.toString()
}

export function createHttpsAgent(requestUrl: string): https.Agent {
  const proxySettings = getProxySettings(requestUrl)
  if (!proxySettings) {
    return new https.Agent({ rejectUnauthorized: false })
  }
  debug(`using proxy ${proxySettings.proxyUrl} for requests to ${requestUrl}`)
  return new HttpsProxyAgent(withCredentials(proxySettings), { rejectUnauthorized: false }) as unknown as https.Agent
}
