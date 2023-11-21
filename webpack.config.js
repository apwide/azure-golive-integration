const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const ReplaceInFileWebpackPlugin = require('replace-in-file-webpack-plugin')
const { ComputeVersion } = require('./webpack.common.config')
const { ExtensionSettings, TaskSettings } = require('./taskSettings')

const Target = path.resolve("./dist")

module.exports = env => {
  const buildEnv = process.env.BUILD_ENV
  const validEnvs = Object.keys(ExtensionSettings)
  if (!validEnvs.includes(buildEnv)) {
    console.log(`BUILD_ENV set to ${buildEnv}`, buildEnv, env)
    console.error(`BUILD_ENV not set correctly. Allowed values are: ${validEnvs.join(', ')}`)
    process.exit(1)
  }

  const { major, minor, patch, full } = ComputeVersion()
  console.log(`Version: ${full}`);

  const entries = Object.keys(TaskSettings)
      .flatMap(task => TaskSettings[task].majorVersions.map(majorVersion => ({ task, majorVersion })))
      .reduce((previous, { task, majorVersion }) => {
    previous[`${task}V${majorVersion}`] = {
      import: `./src/task/${task}/${task}V${majorVersion}/main.ts`,
      filename: `${task}/${task}V${majorVersion}/main.js`
    }
    return previous
  }, {})

  return {
    target: 'node',
    mode: 'production',
    devtool: 'inline-source-map',
    // Do not minimize files by default because non-minimized
    // files are easier to read and hence easier to debug
    optimization: {
      minimize: false
    },
    // Webpack overrides "__dirname" to "/" by default. We need the behavior
    // to be similar to Node's behavior where it refers to the current working directory
    node: {
      __dirname: false
    },
    resolve: {
      modules: ['node_modules'],
      extensions: ['.ts', '.js'],
      alias: {
        '@$': path.resolve(__dirname, 'src')
      }
    },
    module: {
      rules: [
        {
          test: /\.ts?$/,
          exclude: /node_modules/,
          enforce: 'pre',
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.json'
              }
            }
          ]
        }
      ]
    },
    entry: entries,
    // output: {
    //   filename: (pathData, assetInfo) => {
    //     console.log('[JULIEN] output filename', pathData, assetInfo)
    //     return '[name].js'
    //   },
    //   path: path.join(Target)
    // },
    plugins: [
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
      }),

      // extension
      new CopyPlugin({
        patterns: [
          {
            from: path.join(__dirname, './manifests/base.json'),
            to: Target
          },
          {
            from: path.join(__dirname, './src/**/*.md'),
            to: () => `${Target}/[name][ext]`
          },
          {
            from: path.join(__dirname, './src/images'),
            to: path.join(Target, 'images')
          },
          {
            from: path.join(__dirname, './images/golive.png'),
            to: Target
          }
        ]
      }),
      new ReplaceInFileWebpackPlugin([
        {
          dir: Target,
          files: [
            'base.json'
          ],
          rules: [
            {
              search: /{{tag}}/ig,
              replace: ExtensionSettings[buildEnv].Tag
            },
            {
              search: /{{galleryFlag}}/ig,
              replace: buildEnv === 'production' ? 'Public' : 'Private'
            },
            {
              search: /{{version}}/ig,
              replace: full
            },
            {
              search: /({{major}}|\"{{major}}\")/ig,
              replace: major
            },
            {
              search: /({{minor}}|\"{{minor}}\")/ig,
              replace: minor
            },
            {
              search: /({{patch}}|\"{{patch}}\")/ig,
              replace: patch
            }
          ]
        }
      ]),

      // task
      ...Object.keys(TaskSettings).flatMap(task => {
          return TaskSettings[task].majorVersions.flatMap(majorVersion => {

            const taskFolder =  `${task}/${task}V${majorVersion}`
            const taskGuid = TaskSettings[task].envs[buildEnv].TaskGuid
            const tag = ExtensionSettings[buildEnv].Tag

            return [
              new CopyPlugin({
                patterns: [
                  // These files are needed by azure-pipelines-task-lib library.
                  {
                    from: path.resolve('./node_modules/azure-pipelines-task-lib/lib.json'),
                    to: path.join(Target, taskFolder)
                  },
                  {
                    from: path.resolve('./node_modules/azure-pipelines-task-lib/Strings'),
                    to: path.join(Target, taskFolder)
                  },

                  {
                    from: path.join(__dirname, `/src/task/${taskFolder}/task.json`),
                    to: path.join(Target, taskFolder)
                  },
                  {
                    from: path.join(__dirname, './images/task.png'),
                    to: path.join(Target, taskFolder, '/icon.png')
                  }
                ]
              }),
              new ReplaceInFileWebpackPlugin([
                {
                  dir: Target,
                  files: [
                    `${taskFolder}/main.js`
                  ],
                  rules: [
                    // This replacement is required to allow azure-pipelines-task-lib to load the
                    // json resource file correctly
                    {
                      search: /__webpack_require__\(.*\)\(resourceFile\)/,
                      replace: 'require(resourceFile)'
                    },
                  ]
                }
              ]),
              new ReplaceInFileWebpackPlugin([
                {
                  dir: Target,
                  files: [
                    `${taskFolder}/task.json`
                  ],
                  rules: [
                    {
                      search: /{{taskid}}/ig,
                      replace: taskGuid
                    },
                    {
                      search: /{{tag}}/ig,
                      replace: tag
                    },
                    {
                      search: /{{version}}/ig,
                      replace: full
                    },
                    {
                      search: /({{major}}|\"{{major}}\")/ig,
                      replace: majorVersion
                    },
                    {
                      search: /({{minor}}|\"{{minor}}\")/ig,
                      replace: minor
                    },
                    {
                      search: /({{patch}}|\"{{patch}}\")/ig,
                      replace: patch
                    }
                  ]
                }
              ])
            ]
          })
        })
    ]
  }
}
