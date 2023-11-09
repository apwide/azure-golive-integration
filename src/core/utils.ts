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

export function parseDefaultBoolean(optionName: string, value?: string): boolean | undefined {
  if (!value || value.toLocaleLowerCase() === 'default') {
    return undefined
  }
  if (value.toLocaleLowerCase() === 'true') {
    return true
  }
  if (value.toLocaleLowerCase() === 'false') {
    return false
  }
  throw new Error(`Unknown value ${value} for option ${optionName}`)
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

export function fixDate(date?: string) {
  // azure-pipelines-task-lib seems to automatically transform string with a ISO-8601 date format
  // from 2023-01-24T12:00:00Z to 01/24/2023 12:00:00
  // so we do the reverse
  const matches = (date || '').match(/(\d{2})\/(\d{2})\/(\d{4})\s{1}(\d{2}):(\d{2}):(\d{2})/)
  if (!matches?.length) {
    return date
  }
  const M = matches[1]
  const d = matches[2]
  const y = matches[3]
  const H = matches[4]
  const m = matches[5]
  const s = matches[6]

  return `${y}-${M}-${d}T${H}:${m}:${s}Z`
}
