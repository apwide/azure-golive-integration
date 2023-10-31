import * as assert from 'assert'
import * as ttm from 'azure-pipelines-task-lib/mock-test'
import * as path from 'path'

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

function assertNotInConsole(tr: ttm.MockTestRunner, text) {
  assert.ok(!tr.stdout.includes(text), `found in console but should not: ${text}`)
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

  it('should parse commit for issue keys', (done: Mocha.Done) => {
    runTest('withCommitIssueKeys.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertNotInConsole(tr, 'Loading Issue keys from input')
      assertInConsole(tr, "Found issue keys [ 'TEM-10', 'TEM-100', 'TEM-200' ]")
    })
  })

  it('should avoid parsing commit when disabled', (done: Mocha.Done) => {
    runTest('withDisabledParsing.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertNotInConsole(tr, 'Loading Issue keys from commits')
      assertInConsole(tr, 'Found issue keys []')
    })
  })

  it('should parse commit even if input issue keys provided', (done: Mocha.Done) => {
    runTest('withInputAndCommitIssueKeys.js', done, (tr) => {
      assert.equal(tr.succeeded, true)
      assertInConsole(tr, 'Loading Issue keys from input')
      assertInConsole(tr, 'Loading Issue keys from commits')
      assertInConsole(tr, "Found issue keys [ 'TEM-900', 'TEM-902', 'TEM-10', 'TEM-100' ]")
    })
  })
})
