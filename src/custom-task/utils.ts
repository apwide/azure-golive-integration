import tl = require('azure-pipelines-task-lib/task')

export function parseAttributes(attributes?: string): Record<string, string> | undefined {
  try {
    return attributes ? JSON.parse(attributes) : undefined
  } catch (e) {
    throw new Error('Could not parse attributes: ' + e)
  }
}

export function parseIssueKeys(issueKeys?: string): string[] | undefined {
  if (!issueKeys) {
    return undefined
  }
  issueKeys.replace(/\s/g, '').split(',')
}

export function log(message: string, param?: any | null) {
  if (typeof param === 'undefined') {
    console.log(message)
    tl.debug(message)
  } else {
    console.log(message, param)
    tl.debug(`${message}: ${param}`)
  }
}

export function debug(message: string) {
  tl.debug(message)
}
