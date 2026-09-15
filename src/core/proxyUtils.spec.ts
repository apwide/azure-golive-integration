import * as assert from 'assert'
import * as https from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { createHttpsAgent } from './proxyUtils'

const PROXY_ENV_KEYS = [
  'AGENT_PROXYURL',
  'AGENT_PROXYUSERNAME',
  'AGENT_PROXYPASSWORD',
  'AGENT_PROXYBYPASSLIST',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
  'http_proxy',
  'https_proxy',
  'no_proxy'
]

describe('proxyUtils', () => {
  const originalEnv: Record<string, string | undefined> = {}

  beforeEach(() => {
    PROXY_ENV_KEYS.forEach((key) => {
      originalEnv[key] = process.env[key]
      delete process.env[key]
    })
  })

  afterEach(() => {
    PROXY_ENV_KEYS.forEach((key) => {
      if (originalEnv[key] === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = originalEnv[key]
      }
    })
  })

  it('falls back to a plain https.Agent when no proxy is configured', () => {
    const agent = createHttpsAgent('https://golive.example.com/rest')
    assert.ok(agent instanceof https.Agent)
    assert.ok(!(agent instanceof HttpsProxyAgent))
  })

  it('uses the Azure Pipelines agent proxy configuration when available', () => {
    process.env.AGENT_PROXYURL = 'http://agent-proxy.example.com:8080'
    const agent = createHttpsAgent('https://golive.example.com/rest')
    assert.ok(agent instanceof HttpsProxyAgent)
  })

  it('uses HTTPS_PROXY when no agent proxy configuration is set', () => {
    process.env.HTTPS_PROXY = 'http://env-proxy.example.com:3128'
    const agent = createHttpsAgent('https://golive.example.com/rest')
    assert.ok(agent instanceof HttpsProxyAgent)
  })

  it('bypasses the proxy for hosts listed in NO_PROXY', () => {
    process.env.HTTPS_PROXY = 'http://env-proxy.example.com:3128'
    process.env.NO_PROXY = 'example.com'
    const agent = createHttpsAgent('https://golive.example.com/rest')
    assert.ok(!(agent instanceof HttpsProxyAgent))
  })

  it('prefers the Azure Pipelines agent proxy configuration over environment variables', () => {
    process.env.AGENT_PROXYURL = 'http://agent-proxy.example.com:8080'
    process.env.HTTPS_PROXY = 'http://env-proxy.example.com:3128'
    const agent = createHttpsAgent('https://golive.example.com/rest') as HttpsProxyAgent<string>
    assert.ok(agent instanceof HttpsProxyAgent)
    assert.equal(agent.proxy.hostname, 'agent-proxy.example.com')
  })
})
