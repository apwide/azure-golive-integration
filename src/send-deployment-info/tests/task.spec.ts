import { assertContains, assertInConsole, runTest } from '../../tests/azureHelpers'
import * as assert from 'assert'
import * as path from 'path'

function test(file: string): string {
  return path.join(__dirname, file)
}

describe('Send Release Infos Test Suite', () => {
  before((done) => {
    done()
  })

  after(() => {
    // do nothing
  })

  it('should send deployment information', (done: Mocha.Done) => {
    runTest(test('withAll.js'), done, (tr) => {
      assert.equal(tr.succeeded, true)
      assert.equal(tr.errorIssues.length, 0)
      assertInConsole(tr, '2023-01-24T12:10:00Z')
      assertInConsole(
        tr,
        // eslint-disable-next-line max-len
        `Deployment-info sent: {"environment":{"id":"1"},"autoCreateVersion":true,"sendNotification":true,"deployedOn":"2023-01-24T12:10:00Z","scope":{"issueKeys":["TEM-10","TEM-100"],"jql":"project = \\"ECP\\" and key in (ECP-288, ECP-287)"},"versionName":"ECOM-11.2","description":"Generated by Azure"}`
      )
    })
  })

  it('should detect when no target environment', (done: Mocha.Done) => {
    runTest(test('withMissingTargetEnv'), done, (tr) => {
      assert.equal(tr.succeeded, false)
      assertContains(tr.errorIssues, 'At least one of targetEnvironmentId/targetEnvironmentName must be provided')
    })
  })
})
