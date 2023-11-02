import im = require('azure-pipelines-task-lib/internal');
import * as assert from 'assert'

export function setSystemVariable(name: string, val : string) {
    let key : string = im._getVariableKey(name);
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

export async function shouldThrowAsync(callback : any, message : string | RegExp) {
    // act
    let error = null;
    try {
        await callback();
    } 
    catch(err) {
        error = err;
    }
    assert.notEqual(error, null);
    if (message instanceof RegExp) {
        assert.match((error as Error).message, message);
    } else {
        assert.equal((error as Error).message, message);
    }
    
}