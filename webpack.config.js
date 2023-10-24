const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const ReplaceInFileWebpackPlugin = require("replace-in-file-webpack-plugin");
const WebpackCommon = require("./webpack.common.config");

const Target = WebpackCommon.GetTargetPath();

const Settings = {
    "production": {
        Tag: "",
        TaskGuid: "c5ed4c98-e170-4820-877d-cf58c5ee2fcd",
        GalleryFlag: "Public"
    },
    "development": {
        Tag: "Dev",
        TaskGuid: "282ea6d5-b7b2-49eb-897a-a68bf88c4910",
        GalleryFlag: "Private"
    }
    // Can add more flavors here as needed. For example, a flavor for pre-production
};


module.exports = env => {
    const validEnvs = Object.keys(Settings);
    if (!validEnvs.includes(env)) {
        console.log(`BUILD_ENV set to ${env}`, env)
        console.error(`BUILD_ENV not set correctly. Allowed values are: ${validEnvs.join(", ")}`);
        process.exit(1);
    }

    const config = {

        entry: {
            "main": "./src/custom-task/main.ts",
        },

        plugins: [
            new CopyWebpackPlugin([
                // These files are needed by azure-pipelines-task-lib library.
                {
                    from: path.resolve("./node_modules/azure-pipelines-task-lib/lib.json"),
                    to: path.join(Target, "custom-task")
                },
                {
                    from: path.resolve("./node_modules/azure-pipelines-task-lib/Strings"),
                    to: path.join(Target, "custom-task")
                },

                {
                    from: path.join(__dirname, "./src/custom-task/task.json"),
                    to: path.join(Target, "custom-task")
                },
                {
                    from: path.join(__dirname, "./images/task.png"),
                    to: path.join(Target, "custom-task", "icon.png")
                },
                {
                    from: path.join(__dirname, "./manifests/base.json"),
                    to: Target
                },
                {
                    from: path.join(__dirname, "./manifests", `${env}.json`),
                    to: Target
                },
                {
                    from: path.join(__dirname, "./images/golive.png"),
                    to: Target
                },
                {
                    from: path.join(__dirname, "./images/task.png"),
                    to: Target
                },
                {
                    from: path.join(__dirname, "./src/README.md"),
                    to: Target
                },
                {
                    from: path.join(__dirname, "./src/LICENSE.md"),
                    to: Target
                },
                {
                    from: path.join(__dirname, "./src/images"),
                    to: path.join(Target, "images")
                }
            ]),

            WebpackCommon.PackageJsonLoadFixer(Target, [
                "custom-task/main.js",
            ]),

            WebpackCommon.VersionStringReplacer(Target, [
                "custom-task/task.json",
                "base.json"
            ]),

            new ReplaceInFileWebpackPlugin([
                {
                    dir: Target,
                    files: [
                        "custom-task/main.js",
                        "custom-task/task.json",
                        "base.json"
                    ],
                    rules: [
                        // This replacement is required to allow azure-pipelines-task-lib to load the
                        // json resource file correctly
                        {
                            search: /__webpack_require__\(.*\)\(resourceFile\)/,
                            replace: 'require(resourceFile)'
                        },
                        {
                            search: /{{taskid}}/ig,
                            replace: Settings[env].TaskGuid
                        },
                        {
                            search: /{{tag}}/ig,
                            replace: Settings[env].Tag
                        },
                        {
                            search: /{{galleryFlag}}/ig,
                            replace: Settings[env].GalleryFlag
                        }
                    ]
                }
            ])
        ],
    };

    return WebpackCommon.FillDefaultNodeSettings(config, env, "custom-task");
};
