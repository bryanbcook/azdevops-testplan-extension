import tl = require('azure-pipelines-task-lib/task');
import * as TaskParameters from './TaskParameters'
import { TestResultContext } from "./context/TestResultContext";

async function run() {

    const parameters = TaskParameters.getTestContextParameters();

    // construct the context by locating the test plan,
    // populating the test points and supported configurations
    const context = await TestResultContext.create(parameters);


}

run();