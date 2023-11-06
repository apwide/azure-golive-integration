import * as assert from 'assert'
import { extractIssueKeys, fixDate } from './utils'

describe('Parse Commit Message for Issue Keys', () => {
  it('should find issue keys', (done: Mocha.Done) => {
    const issueKeys = extractIssueKeys('here is my commit message: TEM-123 - TEM-234')
    assert.equal(`${issueKeys}`, `${['TEM-123', 'TEM-234']}`)
    done()
  })

  it('should find issue keys separated by /', (done: Mocha.Done) => {
    const issueKeys = extractIssueKeys('here is my commit message: TEM-123/TEM-234')
    assert.equal(`${issueKeys}`, `${['TEM-123', 'TEM-234']}`)
    done()
  })

  it('should find issue keys separated by -', (done: Mocha.Done) => {
    const issueKeys = extractIssueKeys('here is my commit message: TEM-123-TEM-234')
    assert.equal(`${issueKeys}`, `${['TEM-123', 'TEM-234']}`)
    done()
  })

  it('should find issue keys separated by ^', (done: Mocha.Done) => {
    const issueKeys = extractIssueKeys('here is my commit message: TEM-123^TEM-234')
    assert.equal(`${issueKeys}`, `${['TEM-123', 'TEM-234']}`)
    done()
  })

  it('should find issue keys with number in project key', (done: Mocha.Done) => {
    const issueKeys = extractIssueKeys('here is my commit message: TE1-123-TE1-234')
    assert.equal(`${issueKeys}`, `${['TE1-123', 'TE1-234']}`)
    done()
  })

  it('should not find issue keys in middle of text', (done: Mocha.Done) => {
    const issueKeys = extractIssueKeys('here is my commit message with StrangeTextTE1-123-TE1-234')
    assert.equal(`${issueKeys}`, `${['TE1-234']}`)
    done()
  })

  it('should transform date', (done: Mocha.Done) => {
    const date = fixDate('01/24/2023 12:00:00')
    assert.equal(date, '2023-01-24T12:00:00Z')
    done()
  })
})
