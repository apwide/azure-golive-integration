import * as assert from 'assert'
import * as ttm from 'azure-pipelines-task-lib/mock-test'
import * as path from 'path'
import { extractIssueKeys } from '../utils'

// eslint-disable-next-line @typescript-eslint/no-empty-function
function runTest(test: string, done: Mocha.Done, validate: (t: ttm.MockTestRunner) => void = () => {}) {
  const tp = path.join(__dirname, test)
  const mtr: ttm.MockTestRunner = new ttm.MockTestRunner(tp)
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

describe('Send Environment Infos Test Suite', () => {
  before((done) => {
    process.env.ENDPOINT_URL_ID1 = 'bogusURL/'
    process.env.ENDPOINT_AUTH_ID1 = '{"scheme":"apitoken", "parameters": {"apitoken": "mytoken123"}}'
    process.env.ENDPOINT_AUTH_PARAMETER_ID1_APITOKEN = 'mytoken123'
    process.env.ENDPOINT_AUTH_PARAMETER_ID1_SCHEME = 'apitoken'
    done()
  })

  after(() => {
    // do nothing
  })

  it('should succeed without performing any remote call', (done: Mocha.Done) => {
    runTest('withOnlyEnvId.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assert.equal(tr.warningIssues.length, 0)
      assert.equal(tr.errorIssues.length, 0)
      assertInConsole(tr, 'targetEnvironmentId=113')
    })
  })

  it('should update deployed version', (done: Mocha.Done) => {
    runTest('withDeployedVersion.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assert.equal(tr.warningIssues.length, 0)
      assert.equal(tr.errorIssues.length, 0)
      assertInConsole(tr, 'Deployed version updated to ECOM 1.2.3.4')
      assertInConsole(tr, 'targetEnvironmentId=111')
      assertInConsole(tr, 'deploymentVersionName=ECOM 1.2.3.4')
      assertInConsole(tr, 'Deployment performed response')
    })
  })

  it('should fail without connection', (done: Mocha.Done) => {
    runTest('withoutConnection.js', done, (tr) => {
      assert.equal(tr.succeeded, false)
      assert.equal(tr.errorIssues.length > 0, true)
    })
  })

  it('should not create new environment', (done: Mocha.Done) => {
    runTest('withExistingEnvName.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertInConsole(tr, "Found environment { id: 456, name: 'my environment name' }")
      assert.equal(tr.errorIssues.length, 0)
    })
  })

  it('should fail without existing environment name and missing mandatory params', (done: Mocha.Done) => {
    runTest('withUnknownEnvName.js', done, (tr) => {
      assert.equal(tr.succeeded, false)
      assertInConsole(tr, 'Found environment: null')
      assert.equal(tr.errorIssues.length > 0, true)
    })
  })

  it('should auto create environment', (done: Mocha.Done) => {
    runTest('withAutoCreateEnv.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertInConsole(
        tr,
        `Environment created response {
  id: 333,
  name: 'new app new cat',
  application: { id: 12 },
  category: { id: 13 }
}`
      )
      assert.equal(tr.errorIssues.length, 0)
    })
  })

  it('should auto create environment + app + cat', (done: Mocha.Done) => {
    runTest('withAutoCreateAll.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertInConsole(tr, "Application created response { name: 'app', id: '12' }")
      assertInConsole(tr, "Category created response { name: 'cat', id: '13' }")
      assertInConsole(
        tr,
        `Environment created response {
  id: 333,
  name: 'new app new cat',
  application: { id: 12 },
  category: { id: 13 }
}`
      )
      assert.equal(tr.errorIssues.length, 0)
    })
  })

  it('should update environment status only', (done: Mocha.Done) => {
    runTest('withEnvStatusId.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertInConsole(tr, 'Environment Status changed response { status: { id: 23 } }')
      assert.equal(tr.errorIssues.length, 0)
    })
  })

  it('should update environment url only', (done: Mocha.Done) => {
    runTest('withEnvUrl.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertInConsole(tr, "Environment updated response { id: 111, url: 'https://my-new-url.com' }")
      assert.equal(tr.errorIssues.length, 0)
    })
  })

  it('should update all', (done: Mocha.Done) => {
    runTest('withAll.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertInConsole(tr, "Application created response { name: 'app', id: '12' }")
      assertInConsole(tr, "Category created response { name: 'cat', id: '13' }")
      assertInConsole(
        tr,
        `Environment created response {
  id: 333,
  name: 'new app new cat',
  application: { id: 12 },
  category: { id: 13 }
}`
      )
      assertInConsole(tr, 'Deployed version updated to ECOM 1.2.3.4')
      assertInConsole(tr, 'Environment Status changed response { status: { id: 23 } }')
      assertInConsole(tr, "Environment updated response { id: 333, url: 'https://my-new-url.com' }")
      assert.equal(tr.errorIssues.length, 0)
    })
  })

  it('should find issue keys', (done: Mocha.Done) => {
    const issueKeys = extractIssueKeys('here is my commit message: TEM-123 - TEM-234')
    assert.equal(`${issueKeys}`, `${['TEM-123', 'TEM-234']}`)
    done()
  })
})
