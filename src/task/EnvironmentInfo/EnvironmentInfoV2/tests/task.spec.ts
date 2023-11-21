import * as assert from 'assert'
import * as path from 'path'
import { assertInConsole, assertNotInConsole, getBodySentTo, mockServiceConnection, runTest } from '../../../../tests/azureHelpers'
import { EnvironmentInformationRequest } from '../../../../core/GoliveClient'

function test(file: string): string {
  return path.join(__dirname, file)
}

describe('Send Environment Infos Test Suite', () => {
  before((done) => {
    mockServiceConnection()
    done()
  })

  after(() => {
    // do nothing
  })

  it('should succeed without performing any remote call', (done: Mocha.Done) => {
    runTest(test('withOnlyEnvId.js'), done, (tr) => {
      assert.equal(tr.succeeded, true)
      assert.equal(tr.warningIssues.length, 0)
      assert.equal(tr.errorIssues.length, 0)
      assertInConsole(tr, 'No information to send to environment')
      assertNotInConsole(tr, 'Call triggered to')
    })
  })

  it('should fail without connection', (done: Mocha.Done) => {
    runTest(test('withoutConnection.js'), done, (tr) => {
      assert.equal(tr.succeeded, false)
      assert.equal(tr.errorIssues.length > 0, true)
    })
  })

  it('should update all', (done: Mocha.Done) => {
    runTest(test('withAll.js'), done, (tr) => {
      assert.equal(tr.succeeded, true)
      assert.equal(tr.errorIssues.length, 0)
      assertInConsole(
        tr,
        // eslint-disable-next-line max-len
        'Call triggered to POST testBaseURL/environment/information: {"environmentSelector":{"environment":{"name":"new app new cat","autoCreate":true},"application":{"name":"app","autoCreate":true},"category":{"name":"cat","autoCreate":true}},"environment":{"url":"https://my-new-url.com"},"status":{"id":"23"},"deployment":{"versionName":"ECOM 1.2.3.4","issues":{"noFixVersionUpdate":false,"addDoneIssuesFixedInVersion":false,"sendJiraNotification":false}}}'
      )
    })
  })

  it('should parse commit for issue keys', (done: Mocha.Done) => {
    runTest(test('withCommitIssueKeys.js'), done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertNotInConsole(tr, 'Loading Issue keys from input')
      assertInConsole(tr, "Found issue keys [ 'TEM-10', 'TEM-100', 'TEM-200' ]")
    })
  })

  it('should avoid parsing commit when disabled', (done: Mocha.Done) => {
    runTest(test('withDisabledParsing.js'), done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertNotInConsole(tr, 'Loading Issue keys from commits')
      assertInConsole(tr, 'Found issue keys []')
      const sent: EnvironmentInformationRequest = getBodySentTo(tr.stdout, '/environment/information', 'POST')
      assert.equal(sent.deployment.issues?.issueKeys, undefined)
    })
  })
})
