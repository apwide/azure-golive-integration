import tl = require("azure-pipelines-task-lib/task");

async function run() {
  try {
    const environmentId: string | undefined = tl.getInput("environmentId", true);
    console.log("Golive environmentId", environmentId);
  }
  catch (err) {
    // @ts-ignore
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();
