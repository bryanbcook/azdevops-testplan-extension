import { expect } from "chai";
import * as testUtil from './testUtil';
import { FeatureFlags } from "../services/FeatureFlags";

describe('FeatureFlags', () => {

  var subject : FeatureFlags;

  beforeEach(() => {
    testUtil.clearData();
  });

  afterEach(() => {
    testUtil.clearData();
  });

  it('should load feature flags from environment variables', () => {
    // arrange
    testUtil.setFeatureFlag("examplefeature", "true");
    testUtil.setFeatureFlag("anotherfeature", "false");
    testUtil.loadData();

    // act
    subject = new FeatureFlags();

    // assert
    expect(subject.getFlags().length).to.be.greaterThan(0);
  });

  it('should report feature enabled when flag is set to true', () => {
    // arrange
    testUtil.setFeatureFlag("examplefeature", "true");
    testUtil.loadData();
    subject = new FeatureFlags();

    // act
    let enabled = subject.isFeatureEnabled("examplefeature");

    // assert
    expect(enabled).to.be.true;
  });

  it('should report feature disabled when flag set to false', () => {
    // arrange
    testUtil.setFeatureFlag("examplefeature", "false");
    testUtil.loadData();
    subject = new FeatureFlags();
    // act
    let enabled = subject.isFeatureEnabled("examplefeature");
    // assert
    expect(enabled).to.be.false;
  });

  it('should report feature disabled when flag not set', () => {
    // arrange
    subject = new FeatureFlags();
    // act
    let enabled = subject.isFeatureEnabled("examplefeature");
    // assert
    expect(enabled).to.be.false;
  });

  it('should be case insensitive when checking feature flag', () => {
    // arrange
    testUtil.setFeatureFlag("examplefeature", "true");
    testUtil.loadData();
    subject = new FeatureFlags();

    // act
    let enabledLower = subject.isFeatureEnabled("examplefeature");
    let enabledUpper = subject.isFeatureEnabled("EXAMPLEFEATURE");
    let enabledMixed = subject.isFeatureEnabled("ExAmPlEfEaTuRe");

    // assert
    expect(enabledLower).to.be.true;
    expect(enabledUpper).to.be.true;
    expect(enabledMixed).to.be.true;
  });

})