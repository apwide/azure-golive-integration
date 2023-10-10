import * as assert from "assert";
import * as ttm from "azure-pipelines-task-lib/mock-test";
import * as path from "path";

function runTest(test: string) {
  const tp = path.join(__dirname, test);
  const tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);
  tr.run();
  return tr;
}

function assertInConsole(tr: ttm.MockTestRunner, text) {
  assert.equal(tr.stdout.indexOf(text) >= 0, true);
}

describe("Send Environment Infos Test Suite", () => {

  before((done) => {
    process.env.ENDPOINT_URL_ID1 = "bogusURL/";
    process.env.ENDPOINT_AUTH_ID1 = '{\"scheme\":\"apitoken\", \"parameters\": {\"apitoken\": \"mytoken123\"}}';
    process.env.ENDPOINT_AUTH_PARAMETER_ID1_APITOKEN = "mytoken123";
    process.env.ENDPOINT_AUTH_PARAMETER_ID1_SCHEME = "apitoken";
    done();
  });

  after(() => {

  });

  it("should succeed without performing any remote call", (done: Mocha.Done) => {
    const tr = runTest("withOnlyEnvId.js");
    assert.equal(tr.succeeded, true);
    assert.equal(tr.warningIssues.length, 0);
    assert.equal(tr.errorIssues.length, 0);
    assertInConsole(tr, "targetEnvironmentId=113");
    done();
  });

  it("should update deployed version", (done: Mocha.Done) => {
    const tr = runTest("withDeployedVersion.js");
    assert.equal(tr.succeeded, true);
    assert.equal(tr.warningIssues.length, 0);
    assert.equal(tr.errorIssues.length, 0);
    assertInConsole(tr, "Deployed version updated to ECOM 1.2.3.4");
    assertInConsole(tr, "targetEnvironmentId=111");
    assertInConsole(tr, "deploymentVersionName=ECOM 1.2.3.4");
    assertInConsole(tr, "Deployment performed response");
    done();
  });

  it("should fail without connection", (done: Mocha.Done) => {
    const tr = runTest("withoutConnection.js");
    assert.equal(tr.succeeded, false);
    assert.equal(tr.errorIssues.length > 0, true);
    done();
  });

  it("should not create new environment", (done: Mocha.Done) => {
    const tr = runTest("withExistingEnvName.js");
    assert.equal(tr.succeeded, true);
    assertInConsole(tr, "Found environment { id: 456, name: 'my environment name' }");
    assert.equal(tr.errorIssues.length, 0);
    done();
  });

  it("should fail without existing environment name and missing mandatory params", (done: Mocha.Done) => {
    const tr = runTest("withUnknownEnvName.js");
    assert.equal(tr.succeeded, false);
    assertInConsole(tr, "Found environment: undefined");
    assert.equal(tr.errorIssues.length > 0, true);
    done();
  });

  it("should auto create environment", (done: Mocha.Done) => {
    const tr = runTest("withAutoCreateEnv.js");
    assert.equal(tr.succeeded, true);
    assertInConsole(tr, `Environment created response { id: 333,
  name: 'new app new cat',
  application: { id: 12 },
  category: { id: 13 } }`);
    assert.equal(tr.errorIssues.length, 0);
    done();
  });

  it("should auto create environment + app + cat", (done: Mocha.Done) => {
    const tr = runTest("withAutoCreateAll.js");
    assert.equal(tr.succeeded, true);
    assertInConsole(tr, "Application created response { name: 'app', id: '12' }");
    assertInConsole(tr, "Category created response { name: 'cat', id: '13' }");
    assertInConsole(tr, `Environment created response { id: 333,
  name: 'new app new cat',
  application: { id: 12 },
  category: { id: 13 } }`);
    assert.equal(tr.errorIssues.length, 0);
    done();
  });

  it("should update environment status only", (done: Mocha.Done) => {
    const tr = runTest("withEnvStatusId.js");
    assert.equal(tr.succeeded, true);
    assertInConsole(tr, "Environment Status changed response { status: { id: 23 } }");
    assert.equal(tr.errorIssues.length, 0);
    done();
  });

  it("should update environment url only", (done: Mocha.Done) => {
    const tr = runTest("withEnvUrl.js");
    assert.equal(tr.succeeded, true);
    assertInConsole(tr, "Environment updated response { id: 111, url: 'https://my-new-url.com' }");
    assert.equal(tr.errorIssues.length, 0);
    done();
  });

  it("should update all", (done: Mocha.Done) => {
    const tr = runTest("withAll.js");
    assert.equal(tr.succeeded, true);
    assertInConsole(tr, "Application created response { name: 'app', id: '12' }");
    assertInConsole(tr, "Category created response { name: 'cat', id: '13' }");
    assertInConsole(tr, `Environment created response { id: 333,
  name: 'new app new cat',
  application: { id: 12 },
  category: { id: 13 } }`);
    assertInConsole(tr, "Deployed version updated to ECOM 1.2.3.4");
    assertInConsole(tr, "Environment Status changed response { status: { id: 23 } }");
    assertInConsole(tr, "Environment updated response { id: 333, url: 'https://my-new-url.com' }");
    assert.equal(tr.errorIssues.length, 0);
    done();
  });
});
