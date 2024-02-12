import im = require('azure-pipelines-task-lib/internal');
import * as assert from 'assert'
import { ShallowReference, TestPlan, TestConfiguration, TestPoint, WorkItemReference } from 'azure-devops-node-api/interfaces/TestInterfaces';
import { TestFrameworkResult } from '../framework/TestFrameworkResult';

export function setSystemVariable(name: string, val: string) {
  let key: string = im._getVariableKey(name);
  process.env[key] = val;
}

export function setInput(name: string, val: string) {
  let key: string = im._getVariableKey(name);
  process.env['INPUT_' + key] = val;
}

export function loadData() {
  im._loadData();
}

export function clearData() {
  Object.keys(process.env)
    .filter(key => (key.startsWith('INPUT_') ||
      key.startsWith("SECRET_") ||
      key.startsWith("VSTS_TASKVARIABLE_")
    )
    ).forEach(key => delete process.env[key]);
}

export function shouldThrow(callback : any, message : string | RegExp) {
  let error = null;
  try {
    callback();
  }
  catch (err) {
    error = err;
  }
  assert.notEqual(error,null);
  if (message instanceof RegExp) {
    assert.match((error as Error).message, message);
  } else {
    assert.equal((error as Error).message, message);
  }
}

export async function shouldThrowAsync(callback: any, message: string | RegExp) {
  // act
  let error = null;
  try {
    await callback();
  }
  catch (err) {
    error = err;
  }
  assert.notEqual(error, null);
  if (message instanceof RegExp) {
    assert.match((error as Error).message, message);
  } else {
    assert.equal((error as Error).message, message);
  }

}

export function newTestConfig(id : number = 0, name : string = "DefaultConfig") : TestConfiguration {
  return <TestConfiguration>{ id: id, name: name};
}

export function newTestPlan(id : number = 0, name? : string, endDate? : Date) : TestPlan {
  return <TestPlan> { 
    id: id, 
    name: name, 
    endDate: endDate, 
    rootSuite: newShallowReference(id.toString(), name as string)
  };
}

export function newTestPoint(id : number = 0, name : string = "Test 1", configId : string = "0", testCaseId : string = "0" ) {
  return <any>{ 
    id: id, 
    testCaseReference: <WorkItemReference>{ /*TestPoint has testCase, but it should be testCaseReference*/
      id: testCaseId,
      name: name
    },
    configuration: newShallowReference(configId, configId)
  };
}

export function newShallowReference(id : string, name : string) {
  return <ShallowReference>{ id: id, name: name};
}

export function newTestFrameworkResult(name : string = "Test1", outcome : string = "PASS") {
  return new TestFrameworkResult(name, outcome);
}

