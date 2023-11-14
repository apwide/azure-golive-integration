import { debug, fromBase64 } from './utils'

export type Token = {
  userAccountId?: string
  goliveKey?: string
  [key: string]: string
}

export function tokenHeaders(apiToken?: string): Record<string, string> {
  if (!apiToken) {
    return {}
  }
  try {
    const decodedToken = fromBase64(apiToken)
    debug(`decoded token: ${decodedToken}`)
    const token: Token = JSON.parse(fromBase64(apiToken.split('.')[1]))
    debug(`token found for userAccountId ${token.userAccountId} on goliveKey ${token.goliveKey}`)
    return {
      'X-Apw-Account-Id': token.userAccountId,
      'X-Apw-Golive-Key': token.goliveKey
    }
  } catch (error) {
    debug('unable to extract token headers')
    debug(error)
  }
}
