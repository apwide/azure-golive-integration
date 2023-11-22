import { assertContains, assertInConsole, mockServiceConnection, runTest } from '../../../../tests/azureHelpers'
import * as assert from 'assert'
import * as path from 'path'

function test(file: string): string {
  return path.join(__dirname, file)
}

describe('Send Release Infos Test Suite', () => {
  before((done) => {
    mockServiceConnection()
    done()
  })

  after(() => {
    // do nothing
  })

  it('should send release information', (done: Mocha.Done) => {
    runTest(test('withAll.js'), done, (tr) => {
      assert.equal(tr.succeeded, true)
      assert.equal(tr.errorIssues.length, 0)
      assertInConsole(tr, '2023-01-24T12:10:00Z')
      assertInConsole(
        tr,
        // eslint-disable-next-line max-len
        `Call triggered to POST testBaseURL/application/release: {"application":{"id":"1"},"versionDescription":"Generated by Azure","versionName":"ECOM-11.2","startDate":"2023-01-24T12:10:00Z","releaseDate":"2023-11-02T09:30:00Z","released":true,"issues":{"issueKeys":["TEM-10","TEM-100"],"jql":"project = \\"ECP\\" and key in (ECP-288, ECP-287)","sendJiraNotification":true}}`
      )
    })
  })

  it('should detect when no target application', (done: Mocha.Done) => {
    runTest(test('withMissingTargetApp'), done, (tr) => {
      assert.equal(tr.succeeded, false)
      assertContains(tr.errorIssues, 'At least one of targetApplicationId/targetApplicationName must be provided')
    })
  })
})
