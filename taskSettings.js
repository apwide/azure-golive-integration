// Can add more flavors here as needed. For example, a flavor for pre-production
const ExtensionSettings = {
  production: {
    Tag: ''
  },
  development: {
    Tag: 'Dev'
  }
}

const TaskSettings = {
  'environment-info': {
    production: {
      TaskGuid: 'c5ed4c98-e170-4820-877d-cf58c5ee2fcd'
    },
    development: {
      TaskGuid: '282ea6d5-b7b2-49eb-897a-a68bf88c4910'
    }
  },
  'send-release-info': {
    production: {
      TaskGuid: '4451bb99-46d9-4b3b-bbfc-bfba4a931c55'
    },
    development: {
      TaskGuid: 'b8fb09a7-d958-46b2-baac-3d1dbc1a1faa'
    }
  },
  'send-deployment-info': {
    production: {
      TaskGuid: '6ecd2901-9b64-446f-8f14-36f190be8318'
    },
    development: {
      TaskGuid: '0e43074d-be58-420a-b1d9-e162ad6ccc91'
    }
  }
}

module.exports = {
  ExtensionSettings,
  TaskSettings
}
