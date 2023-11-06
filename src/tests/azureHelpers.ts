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

export { runTest, assertInConsole, assertNotInConsole, assertContains }
