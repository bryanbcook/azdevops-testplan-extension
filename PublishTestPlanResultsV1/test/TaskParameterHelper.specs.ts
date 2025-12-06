import { expect } from "chai";
import { TaskParameterHelper } from "../services/TaskParameterHelper";
import { TelemetryPayloadBuilder } from "../services/TelemetryPayloadBuilder";
import * as testUtil from './testUtil';

describe('TaskParameterHelper', () => {

  var subject : TaskParameterHelper;
  var payloadBuilder : TelemetryPayloadBuilder;

  beforeEach(() => {
    testUtil.clearData();

    payloadBuilder = new TelemetryPayloadBuilder();
    subject = new TaskParameterHelper(payloadBuilder);
  });

  afterEach(() => {
    testUtil.clearData();
  });

  context('getInputOrFallback', () => {

    it('should return input value when specified', () => {
      // arrange
      testUtil.setInput("taskInputName", "userValue");
      testUtil.loadData();

      // act
      let result = subject.getInputOrFallback("taskInputName", () => "defaultValue");

      // assert
      expect(result).to.equal("userValue");
    });

    it('should return default value when input is not specified', () => {
      // arrange
      testUtil.clearData();
      testUtil.loadData();

      // act
      let result = subject.getInputOrFallback("taskInputName", () => "defaultValue");

      // assert
      expect(result).to.equal("defaultValue");
    });

    context('recordNonDefault', () => {
      it('default usage should not record non-default value when input is provided', () => {
        // arrange
        testUtil.setInput("taskInputName", "userValue");
        testUtil.loadData();
        // act
        let result = subject.getInputOrFallback("taskInputName", () => "defaultValue");
        // assert
        expect(result).to.equal("userValue");
        expect(payloadBuilder.getPayload().properties).to.be.undefined;
      });

      it('should record that custom value was used when input is provided and recordNonDefault is true', () => {
        // arrange
        testUtil.setInput("taskInputName", "userValue");
        testUtil.loadData();
        // act
        let result = subject.getInputOrFallback("taskInputName", () => "defaultValue", { recordNonDefault: true });
        // assert
        expect(result).to.equal("userValue");
        expect(payloadBuilder.getPayload().taskInputName_custom).to.be.true;
      });

      it('should not record that fallback value is used and recordNonDefault is true', () => {
        // arrange
        testUtil.loadData();
        
        // act
        let result = subject.getInputOrFallback("taskInputName", () => "defaultValue", { recordNonDefault: true });

        // assert
        expect(result).to.equal("defaultValue");
        expect(payloadBuilder.getPayload().taskInputName_custom).to.be.undefined;
      });
    });

    context('recordValue', () => {
      it('default value should not record user supplied value', () => {
        // arrange
        testUtil.setInput("taskInputName", "userValue");
        testUtil.loadData();
        // act
        let result = subject.getInputOrFallback("taskInputName", () => "defaultValue", { recordValue: true });
        // assert
        expect(result).to.equal("userValue");
        expect(payloadBuilder.getPayload().properties).to.be.undefined;
      });

      it('should record user supplied value when recordValue is true', () => {
        // arrange
        testUtil.setInput("taskInputName", "userValue");
        testUtil.loadData();
        // act
        let result = subject.getInputOrFallback("taskInputName", () => "defaultValue", { recordValue: true });
        // assert
        expect(result).to.equal("userValue");
        expect(payloadBuilder.getPayload().taskInputName).to.equal("userValue");
      });
    });

    context('anonymize', () => {
      it('should record anonymized value when anonymize is true', () => {
        // arrange
        testUtil.setInput("taskInputName", "userValue");
        testUtil.loadData();
        // act
        let result = subject.getInputOrFallback("taskInputName", () => "defaultValue", { anonymize: true });
        // assert
        expect(result).to.equal("userValue");
        expect(payloadBuilder.getPayload().taskInputName).to.not.be.undefined;
        expect(payloadBuilder.getPayload().taskInputName).to.not.equal("userValue");
      });
    })
  });

});