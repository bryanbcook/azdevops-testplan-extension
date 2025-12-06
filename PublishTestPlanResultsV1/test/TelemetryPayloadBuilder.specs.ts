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

    it('should not add element when value is the default value', () => {
      
      // act
      subject.add("taskInputName", "someValue", "someValue");

      // assert
      expect(subject.getPayload().taskInputName).to.be.undefined;
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

});