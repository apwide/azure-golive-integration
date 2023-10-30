function mockFetch(
  data: {
    foundEnvironments?: any[]
    foundApplications?: any[]
    foundCategories?: any[]
    createdApplication?: any
    createdCategory?: any
    createdEnvironment?: any
    updatedEnvironmentStatus?: any
    updatedEnvironment?: any
    updatedDeployment?: any
    put?: () => any
    post?: () => any
    get?: () => any
  } = {}
) {
  return {
    default: async (url, options: any = {}) => {
      return {
        status: 200,
        ok: true,
        async json() {
          if (options.method?.toLowerCase() === 'post') {
            console.log('Mock answer of this POST:', options)
            if (data.post) {
              return data.post()
            }
            if (url.includes('/environments/search/paginated')) {
              return { environments: data.foundEnvironments }
            }
            if (url.includes('/application')) {
              return data.createdApplication
            }
            if (url.includes('/category')) {
              return data.createdCategory
            }
            if (url.includes('/environment')) {
              return data.createdEnvironment
            }
          } else if (options.method?.toLowerCase() === 'put') {
            console.log('Mock answer of this PUT:', options)
            if (data.put) {
              return data.put()
            }
            if (url.includes('/status-change?environmentId=')) {
              return data.updatedEnvironmentStatus
            }
            if (url.includes('/environment/')) {
              return data.updatedEnvironment
            }
            if (url.includes('/deployment?environmentId=')) {
              return data.updatedDeployment
            }
          } else {
            console.log('Mock answer of this GET:', options)
            if (data.get) {
              return data.get()
            }
            if (url.includes('/environments/search/paginated')) {
              return JSON.stringify({ environments: data.foundEnvironments })
            }
            if (url.includes('/applications')) {
              return JSON.stringify(data.foundApplications)
            }
            if (url.includes('/categories')) {
              return JSON.stringify(data.foundCategories)
            }
          }
        }
      }
    }
  }
}

export = mockFetch
