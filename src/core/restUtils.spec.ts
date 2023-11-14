import * as assert from 'assert'
import { tokenHeaders } from './restUtils'

describe('Golivve Client', () => {
  it('should extract headers from token', (done: Mocha.Done) => {
    const headers = tokenHeaders(
      // eslint-disable-next-line max-len
      'eyJraWQiOiJnb2xpdmUta2V5IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJnb2xpdmUtYXBpLWtleSIsInVzZXJBY2NvdW50SWQiOiI1NTcwNTg6MzFlMTk1NzAtMjRhYi00ZDFmLWI1YmMtODRlYzUyM2M3MzhkIiwiaXNzIjoiaHR0cDovL3d3dy5hcHdpZGUuY29tIiwiaWF0IjoxNzAwNTUxMzk3LCJnb2xpdmVLZXkiOiJmM2E2ZjE0Mi00Y2Y1LTQ5ZTAtOGYzZi1iOTVmYTQ3ZGQ3ZGEiLCJqdGkiOiIwMjljYWU3My02ZWUwLTRhZjMtOTI0ZC0zNmQ3OTU2MTkwNmUifQ.mKxGBj9E0lMLgQx_RUbQfwHGCYWktHm2cyYKlW5bdzu2oZsLBkBjwVQNTI8M6l9mKH3o6YiI3e80EgMLaSL5lSnvECa2mpnoyq7FXWzPq6kpiBv-IbhOJuCX4tgaBaezzxs0Rr3bjW73690fS5nUG8TORiEN8eCKExOVoqtuvBZo8A1Jqsy6N2CJ9k8khz4Zm7H4WaXUX9tcIqc2BTOFG-8q3vmSKpyAh4_VQrT823zE_pReeuKmY8KN1iD6gMuZDAqjwgyStj1BN3kpncR8q8N_Gqca5gU4ILdC158Fj7MfQJ64_4i_Z3s3RTxjpOg2JbqpWtVyUNheSIV0m7xRZg'
    )
    assert.equal(headers['X-Apw-Account-Id'], '557058:31e19570-24ab-4d1f-b5bc-84ec523c738d')
    assert.equal(headers['X-Apw-Golive-Key'], 'f3a6f142-4cf5-49e0-8f3f-b95fa47dd7da')
    done()
  })
})
