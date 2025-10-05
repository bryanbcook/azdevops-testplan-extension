import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import * as util from './testUtil';
import * as ResultAnalyzer from '../services/ResultAnalyzer';

describe('ResultAnalyzer', () => {

  let results: TestFrameworkResult[];

  beforeEach(() => {
    util.clearData();
  })

  afterEach(() => {
    util.clearData();
  })

  context('failTaskOnFailingTests is enabled', () => {

    beforeEach(() => {
      util.setInput('failTaskOnFailingTests', 'true');
      util.loadData();
    });

    it('should throw an exception if there are failing tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "FAIL"), new TestFrameworkResult("Test2", "PASS")];

      // act / assert
      util.shouldThrow(() => ResultAnalyzer.ensureNoFailingTests(results), "Test framework results contain failing tests.");
    });

    it('should not throw an exception if there are no failing tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "PASS"), new TestFrameworkResult("Test2", "PASS")];
      // act
      ResultAnalyzer.ensureNoFailingTests(results);
    });

  });

  context('failTaskOnFailingTests is not enabled', () => {

    beforeEach(() => {
      util.loadData();
    });
    
    it('should not throw an exception if there are failing tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "FAIL"), new TestFrameworkResult("Test2", "PASS")];

      // act
      ResultAnalyzer.ensureNoFailingTests(results);
    });

  });
});