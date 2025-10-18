import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import * as util from './testUtil';
import * as StatusFilter from '../services/StatusFilter';

describe('StatusFilter', () => {

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
      util.shouldThrow(() => StatusFilter.analyzeTestResults(results), "Test framework results contain failing tests.");
    });

    it('should not throw an exception if there are no failing tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "PASS"), new TestFrameworkResult("Test2", "PASS")];
      // act
      StatusFilter.analyzeTestResults(results);
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
      StatusFilter.analyzeTestResults(results);
    });

  });

  context('failTaskOnSkippedTests is enabled', () => {
    beforeEach(() => {
      util.setInput('failTaskOnSkippedTests', 'true');
      util.loadData();
    });

    it('should throw an exception if there are skipped tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "SKIP"), new TestFrameworkResult("Test2", "PASS")];

      // act / assert
      util.shouldThrow(() => StatusFilter.analyzeTestResults(results), "Test framework results contain skipped tests.");
    });

    it('should not throw an exception if there are no failing tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "PASS"), new TestFrameworkResult("Test2", "PASS")];
      // act
      StatusFilter.analyzeTestResults(results);
    });    
  })

  context('failTaskOnSkippedTests is not enabled', () => {

    beforeEach(() => {
      util.loadData();
    });
    
    it('should not throw an exception if there are skipped tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "SKIP"), new TestFrameworkResult("Test2", "PASS")];

      // act
      StatusFilter.analyzeTestResults(results);
    });

  });
});