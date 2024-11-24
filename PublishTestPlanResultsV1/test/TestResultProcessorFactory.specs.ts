import { expect } from 'chai';

import { TestPlan } from 'azure-devops-node-api/interfaces/TestInterfaces';
import { TestResultContext } from '../context/TestResultContext';
import { TestResultProcessorParameters } from '../processing/TestResultProcessorParameters';

import * as subject from '../processing/TestResultProcessorFactory';

describe('TestResultProcessorFactory', () => {

  var ctx : TestResultContext;
  var parameters : TestResultProcessorParameters;

  beforeEach( () => {
    let dummyPlan = <TestPlan>{id:1};
    ctx = new TestResultContext("projectId","projectName", dummyPlan);
  });
  
  it('Should configure all matchers when set to auto', async () => {
    // arrange
    parameters = new TestResultProcessorParameters("auto");

    // act
    var result = subject.create(parameters, ctx);

    // assert
    expect(result.matchers.length).to.eq(5);
  });

  it('Should configure only name matcher when set to name', async () => {
    // arrange
    parameters = new TestResultProcessorParameters("name");

    // act
    var result = subject.create(parameters, ctx);

    // assert
    expect(result.matchers.length).to.eq(2); /* config filter is always present */
  });

  it('Should configure only prop matcher when set to property', async () => {
    // arrange
    parameters = new TestResultProcessorParameters("property");

    // act
    var result = subject.create(parameters, ctx);

    // assert
    expect(result.matchers.length).to.eq(2); /* config filter is always present */
  });

  it('Should configure only regex matcher when set to regex', async () => {
    // arrange
    parameters = new TestResultProcessorParameters("regex");

    // act
    var result = subject.create(parameters, ctx);

    // assert
    expect(result.matchers.length).to.eq(2); /* config filter is always present */
  });

  it('Should configure only vsprop matcher when set to vsproperty', async () => {
    // arrange
    parameters = new TestResultProcessorParameters("vsproperty");

    // act
    var result = subject.create(parameters, ctx);

    // assert
    expect(result.matchers.length).to.eq(2); /* config filter is always present */
  });
})