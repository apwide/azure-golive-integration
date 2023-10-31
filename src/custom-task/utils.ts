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
  return issueKeys.replace(/\s/g, '').split(',')
}

export function log(message: string, param?: any | null) {
  if (typeof param === 'undefined') {
    console.log(message)
    tl.debug(message)
  } else {
    console.log(message, param)
    tl.debug(`${message}: ${param ? JSON.stringify(param) : null}`)
  }
}

export function debug(message: string) {
  tl.debug(message)
}

const PUNCT = '!:;<=>?,@#%&*+_\\-./^|~{}[\\]\'"'
const SEPARATOR = '[\\s' + PUNCT + ']'
const KEY_PREFIX_REGEX = '(?:(?<=' + SEPARATOR + ')|^)'
const KEY_BODY_REGEX = '([A-Z][A-Z\\d_]{1,255}-\\d{1,100})'
const KEY_POSTFIX_REGEX = '(?:(?=' + SEPARATOR + ')|$)'
const ISSUE_KEY_REGEX = KEY_PREFIX_REGEX + KEY_BODY_REGEX + KEY_POSTFIX_REGEX
// const ISSUE_KEY_MAX_LIMIT = 100;

const NAIVE_PATTERN = ''

export function extractIssueKeys(text: string): string[] {
  return text.match(new RegExp(ISSUE_KEY_REGEX, 'g')) || []
}

export function unique(values: string[]): string[] {
  return Array.from(new Set(values))
}
