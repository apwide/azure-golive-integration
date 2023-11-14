type Call = {
  method?: 'GET' | 'PUT' | 'POST' | 'DELETE'
  url: string
}
type Answer = (
  url: string,
  options: any
) => {
  status?: number
  ok?: boolean
  responseBody?: any
}

type MockedCall = {
  call?: Call
  answer?: Answer
}

const defaultAnswer: Answer = () => {
  console.log(`Call not mocked and will return default success response`)
  return {
    status: 200,
    ok: true,
    responseBody: {}
  }
}

function match(calledUrl: string, options: any = {}) {
  const originalMethod = options.method || 'GET'
  return ({ call }: MockedCall) => {
    const { url, method } = call || {}
    if (!url) {
      if (!method) {
        return true
      } else {
        return originalMethod === method
      }
    }
    if (!method) {
      return calledUrl.includes(url)
    }
    return calledUrl.includes(url) && originalMethod === method
  }
}

function mockFetch(calls: MockedCall[] = []) {
  return {
    default: async (url, options: any = {}) => {
      const originalMethod = options.method || 'GET'
      console.log(`Call triggered to ${originalMethod} ${url}: ${options.body}`)
      const answer = calls.find(match(url, options))?.answer || defaultAnswer
      const response = answer(url, options)
      return {
        status: response?.status || 200,
        ok: typeof response?.ok === 'undefined' ? true : response.ok,
        async text() {
          const json = await this.json()
          return json ? JSON.stringify(json) : undefined
        },
        async json() {
          return response
        }
      }
    }
  }
}

export = mockFetch
