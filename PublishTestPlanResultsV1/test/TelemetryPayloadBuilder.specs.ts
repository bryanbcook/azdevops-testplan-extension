import { expect } from "chai";
import { TelemetryPayloadBuilder } from "../services/TelemetryPayloadBuilder";

describe('TelemetryPayloadBuilder', () => {

  var subject : TelemetryPayloadBuilder;

  beforeEach(() => {
    subject = new TelemetryPayloadBuilder();
  });

  context('add telemetry element', () => {

    it('should add element when value is defined and not default', () => {
      
      // act
      subject.add("taskInputName", "someValue");

      // assert
      expect(subject.getPayload().taskInputName).to.equal("someValue");      
    });
  });

  context('recordAnonymizedValue', () => {

    it('should add anonymized value to payload', () => {
      // act
      subject.recordAnonymizedValue("taskInputName", "someValue");

      // assert
      let payload = subject.getPayload();
      expect(payload.taskInputName).to.not.be.undefined;
      expect(payload.taskInputName).to.not.equal("someValue");
    });

    // ensure that hashing is consistent
    // also proves that values can be reversed if you know the original value
    it('should produce the same anonymized value for the same input', () => {
      // arrange
      let originalValue = "someValue";
      let parameter = "taskInputName";
      let subject1 = new TelemetryPayloadBuilder();
      let subject2 = new TelemetryPayloadBuilder();
      
      // act
      subject1.recordAnonymizedValue(parameter, originalValue);
      subject2.recordAnonymizedValue(parameter, originalValue);

      // assert
      let payload1 = subject1.getPayload();
      let payload2 = subject2.getPayload();
      expect(payload1.taskInputName).to.equal(payload2.taskInputName);
    });
  });

  context('recordNonDefaultValue', () => {

    it('should record that a non-default value was used', () => {
      // act
      subject.recordNonDefaultValue("taskInputName");

      // assert
      let payload = subject.getPayload();
      expect(payload.taskInputName_custom).to.equal(true);
    });

  });

  context('recordError', () => {
    it('should not record error details when error is undefined', () => {
      
      // act
      subject.recordError(undefined);

      // assert
      let payload = subject.getPayload();
      expect(payload.errorMessage).to.be.undefined;
    });

    it('should record error details when error is provided', () => {
      // arrange
      const error = new Error("Something bad happened");
      // act
      subject.recordError(error);
      // assert
      let payload = subject.getPayload();
      expect(payload.errorMessage).to.eq("Something bad happened");
    });

    it('should capture stack trace as array of strings', () => {
      // arrange
      const error = new Error("Something bad happened");
      error.stack = "Error: Something bad happened\n    at Object.<anonymous> (C:\\dev\\code\\testplan-extension\\PublishTestPlanResultsV1\\test\\TelemetryPayloadBuilder.specs.ts:10:15)\n    at Module._compile (internal/modules/cjs/loader.js:999:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)";

      // act
      subject.recordError(error);

      // assert
      let payload = subject.getPayload();
      expect(payload.errorStack).to.be.an('array');
      expect(payload.errorStack.length).to.equal(4);
      expect(payload.errorStack[0]).to.equal("Error: Something bad happened");
      expect(payload.errorStack[1]).to.equal("at Object.<anonymous> (C:\\dev\\code\\testplan-extension\\PublishTestPlanResultsV1\\test\\TelemetryPayloadBuilder.specs.ts:10:15)");
      expect(payload.errorStack[2]).to.equal("at Module._compile (internal/modules/cjs/loader.js:999:30)");
      expect(payload.errorStack[3]).to.equal("at Object.Module._extensions..js (internal/modules/cjs/loader.js:1027:10)");
    });
  })

});