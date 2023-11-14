import * as ttm from 'azure-pipelines-task-lib/mock-test'
import * as assert from 'assert'

// eslint-disable-next-line @typescript-eslint/no-empty-function
function runTest(test: string, done: Mocha.Done, validate: (t: ttm.MockTestRunner) => void = () => {}) {
  const mtr: ttm.MockTestRunner = new ttm.MockTestRunner(test)
  try {
    mtr.run()
    validate(mtr)
    done()
  } catch (error) {
    console.log(mtr.stdout)
    console.log(mtr.stderr)
    throw error
  }
}

function assertInConsole(tr: ttm.MockTestRunner, text) {
  assert.ok(tr.stdout.includes(text), `not found in console: ${text}`)
}

function assertContains(array: string[], value: string) {
  assert.ok(array.includes(value), `'${value}' has not been found in ${array}`)
}

function assertNotInConsole(tr: ttm.MockTestRunner, text) {
  assert.ok(!tr.stdout.includes(text), `found in console but should not: ${text}`)
}

function mockServiceConnection() {
  process.env.ENDPOINT_URL_ID1 = 'testBaseURL/'
  process.env.ENDPOINT_AUTH_ID1 = '{"scheme":"apitoken", "parameters": {"apitoken": "mytoken123"}}'
  process.env.ENDPOINT_AUTH_PARAMETER_ID1_APITOKEN = 'mytoken123'
  process.env.ENDPOINT_AUTH_PARAMETER_ID1_SCHEME = 'apitoken'
}

function getBodySentTo(stdout: string, url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET') {
  const result = new RegExp(`(Call triggered to ${method} testBaseURL${url}:\\s*)(.*)\\n`).exec(stdout)
  if (result.length > 1) {
    return JSON.parse(result[2])
  }
  return undefined
}

export { runTest, assertInConsole, assertNotInConsole, assertContains, mockServiceConnection, getBodySentTo }
