import { TestFrameworkResult } from "../framework/TestFrameworkResult";
import * as util from './testUtil';
import * as StatusFilter from '../services/StatusFilter';
import { StatusFilterParameters } from "../services/StatusFilterParameters";

describe('StatusFilter', () => {

  let results: TestFrameworkResult[];
  let parameters: StatusFilterParameters;

  context('failTaskOnFailingTests is enabled', () => {

    beforeEach(() => {
      parameters = new StatusFilterParameters();
      parameters.failTaskOnFailedTests = true;
    });

    it('should throw an exception if there are failing tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "FAIL"), new TestFrameworkResult("Test2", "PASS")];

      // act / assert
      util.shouldThrow(() => StatusFilter.analyzeTestResults(results, parameters), "Test framework results contain failing tests.");
    });

    it('should not throw an exception if there are no failing tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "PASS"), new TestFrameworkResult("Test2", "PASS")];
      // act
      StatusFilter.analyzeTestResults(results, parameters);
    });

  });

  context('failTaskOnFailingTests is not enabled', () => {

    beforeEach(() => {
      parameters = new StatusFilterParameters();
    });
    
    it('should not throw an exception if there are failing tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "FAIL"), new TestFrameworkResult("Test2", "PASS")];

      // act
      StatusFilter.analyzeTestResults(results, parameters);
    });

  });

  context('failTaskOnSkippedTests is enabled', () => {
    beforeEach(() => {
      parameters = new StatusFilterParameters();
      parameters.failTaskOnSkippedTests = true;
    });

    it('should throw an exception if there are skipped tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "SKIP"), new TestFrameworkResult("Test2", "PASS")];

      // act / assert
      util.shouldThrow(() => StatusFilter.analyzeTestResults(results, parameters), "Test framework results contain skipped tests.");
    });

    it('should not throw an exception if there are no failing tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "PASS"), new TestFrameworkResult("Test2", "PASS")];
      // act
      StatusFilter.analyzeTestResults(results, parameters);
    });    
  })

  context('failTaskOnSkippedTests is not enabled', () => {

    beforeEach(() => {
      parameters = new StatusFilterParameters();
    });
    
    it('should not throw an exception if there are skipped tests', () => {
      // arrange
      results = [new TestFrameworkResult("Test1", "SKIP"), new TestFrameworkResult("Test2", "PASS")];

      // act
      StatusFilter.analyzeTestResults(results, parameters);
    });

  });
});