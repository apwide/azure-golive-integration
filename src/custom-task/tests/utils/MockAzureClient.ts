const NullAzureClient = {
  getAzureClient() {
    return {
      async getOldestFailedBuildDifferentThan() {
        console.log('You searched for oldest')
        return null
      },
      async getCommits() {
        console.log('YOu asked for commits')
        return []
      }
    }
  }
}

export default NullAzureClient
