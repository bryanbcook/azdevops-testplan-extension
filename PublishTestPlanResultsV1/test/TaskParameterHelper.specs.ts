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

      it('should not record that fallback value was used when recordNonDefault is true', () => {
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

      it('should not record default value if dontRecordDefault is true', () => {
        // arrange
        testUtil.loadData();

        // act
        let result = subject.getInputOrFallback("taskInputName", () => "defaultValue", { recordValue: true, dontRecordDefault: true });
        
        // assert
        expect(result).to.equal("defaultValue");
        expect(payloadBuilder.getPayload().taskInputName).to.be.undefined;
      })
    });

    context('dontRecordDefault', () => {
      it('should record non-default value when input is provided and dontRecordDefault is true', () => {
        // arrange
        testUtil.setInput("taskInputName", "userValue");
        testUtil.loadData();

        // act
        let result = subject.getInputOrFallback("taskInputName", () => "defaultValue", { recordValue: true, dontRecordDefault: true });

        // assert
        expect(result).to.equal("userValue");
        expect(payloadBuilder.getPayload().taskInputName).to.equal("userValue");
      });

      it('should not record default value when input is default value and dontRecordDefault is true', () => {
        // arrange
        testUtil.setInput("taskInputName", "defaultValue");
        testUtil.loadData();

        // act
        let result = subject.getInputOrFallback("taskInputName", () => "defaultValue", { recordValue: true, dontRecordDefault: true });

        // assert
        expect(result).to.equal("defaultValue");
        expect(payloadBuilder.getPayload().taskInputName).to.be.undefined;
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

  context('getInput', () => {

    it('should return input value when specified', () => {
      // arrange
      testUtil.setInput("taskInputName", "userValue");
      testUtil.loadData();

      // act
      let result = subject.getInput("taskInputName", false);

      // assert
      expect(result).to.equal("userValue");
    });

    it('should return undefined when input is not specified', () => {
      // arrange
      testUtil.clearData();
      testUtil.loadData();

      // act
      let result = subject.getInput("taskInputName", false);

      // assert
      expect(result).to.be.undefined;
    });

    it('should record user value if specified in options', () => {
      // arrange
      testUtil.setInput("taskInputName", "userValue");
      testUtil.loadData();

      // act
      let result = subject.getInput("taskInputName", false, { recordValue: true });

      // assert
      expect(payloadBuilder.getPayload().taskInputName).to.equal("userValue");
      expect(payloadBuilder.getPayload().taskInputName_custom).to.be.undefined;
    });

    it('should not record user value if not specified', () => {
      // arrange
      testUtil.setInput("taskInputName", "userValue");
      testUtil.loadData();

      // act
      let result = subject.getInput("taskInputName", false);

      // assert
      expect(payloadBuilder.getPayload().taskInputName).to.be.undefined;
      expect(payloadBuilder.getPayload().taskInputName_custom).to.be.undefined;
    });

    it('should record that custom user value was provided if specified in options', () => {
      // arrange
      testUtil.setInput("taskInputName", "userValue");
      testUtil.loadData();

      // act
      let result = subject.getInput("taskInputName", false, { recordNonDefault: true });

      // assert
      expect(payloadBuilder.getPayload().taskInputName_custom).to.be.true;
      expect(payloadBuilder.getPayload().taskInputName).to.be.undefined;
    });

  });

  context('getBoolInput', () => {
    it('should return input value when specified', () => {
      // arrange
      testUtil.setInput("taskInputName", "true");
      testUtil.loadData();

      // act
      let result = subject.getBoolInput("taskInputName", false);

      // assert
      expect(result).to.equal(true);
    });

    it('should return default value when input is not specified', () => {
      // arrange
      testUtil.clearData();
      testUtil.loadData();

      // act
      let result = subject.getBoolInput("taskInputName", true);

      // assert
      expect(result).to.equal(true);
    });

    it('should record user value if specified in options', () => {
      // arrange
      testUtil.setInput("taskInputName", "true");
      testUtil.loadData();

      // act
      let result = subject.getBoolInput("taskInputName", false, { recordValue: true });

      // assert
      expect(payloadBuilder.getPayload().taskInputName).to.equal(true);
      expect(payloadBuilder.getPayload().taskInputName_custom).to.be.undefined;
    });

    it('should record that custom user value was provided if specified in options', () => {
      // arrange
      testUtil.setInput("taskInputName", "true");
      testUtil.loadData();

      // act
      let result = subject.getBoolInput("taskInputName", false, { recordNonDefault: true });

      // assert
      expect(payloadBuilder.getPayload().taskInputName_custom).to.be.true;
      expect(payloadBuilder.getPayload().taskInputName).to.be.undefined;
    });

    it('should not record a value when input matches the default and recordNonDefault is specified', () => {
      // arrange
      testUtil.setInput("taskInputName", "false");
      testUtil.loadData();

      // act
      let result = subject.getBoolInput("taskInputName", false, { recordNonDefault: true });

      // assert
      expect(payloadBuilder.getPayload().taskInputName).to.be.undefined;
      expect(payloadBuilder.getPayload().taskInputName_custom).to.be.undefined;
    });

    it('should record the value if non-default value is provided and recordValue and dontRecordDefault are specified', () => {
      // arrange
      testUtil.setInput("taskInputName", "true");
      testUtil.loadData();

      // act
      subject.getBoolInput("taskInputName", false, { recordValue: true, dontRecordDefault: true });

      // assert
      expect(payloadBuilder.getPayload().taskInputName).to.equal(true);
      expect(payloadBuilder.getPayload().taskInputName_custom).to.be.undefined;
    });

    it('should not record the value if default value is provided and recordValue and dontRecordDefault are specified', () => {
      // arrange
      testUtil.setInput("taskInputName", "false");
      testUtil.loadData();

      // act
      subject.getBoolInput("taskInputName", false, { recordValue: true, dontRecordDefault: true });

      // assert
      expect(payloadBuilder.getPayload().taskInputName).to.be.undefined;
      expect(payloadBuilder.getPayload().taskInputName_custom).to.be.undefined;
    });
  })

  context('getDelimitedInput', () => {
    it('should return array of input values when specified', () => {
      // arrange
      testUtil.setInput("taskInputName", "value1,value2,value3");
      testUtil.loadData();

      // act
      let result = subject.getDelimitedInput("taskInputName");

      // assert
      expect(result).to.deep.equal(["value1", "value2", "value3"]);
    });

    it('should return empty array when input is not specified', () => {
      // arrange
      testUtil.clearData();
      testUtil.loadData();

      // act
      let result = subject.getDelimitedInput("taskInputName");

      // assert
      expect(result).to.deep.equal([]);
    });

    it('should record value in telemetry when recordValue is true', () => {
      // arrange
      testUtil.setInput("taskInputName", "value1,value2,value3");
      testUtil.loadData();
      // act
      let result = subject.getDelimitedInput("taskInputName", { recordValue: true });

      // assert
      const payload = subject.getPayload();
      expect(payload.taskInputName).to.eq("value1,value2,value3");
      expect(payload.taskInputName_custom).to.be.undefined;
    });

    it('should record that custom value was provided when recordNonDefault is true', () => {
      // arrange
      testUtil.setInput("taskInputName", "value1,value2,value3");
      testUtil.loadData();

      // act
      let result = subject.getDelimitedInput("taskInputName", { recordNonDefault: true });

      // assert
      const payload = subject.getPayload();
      expect(payload.taskInputName).to.be.undefined;
      expect(payload.taskInputName_custom).to.be.true;
    });
  });

  context('recordStage', () => {
    it('should record the current task stage', () => {
      // arrange
      testUtil.loadData();

      // act
      subject.recordStage("createContext");

      // assert
      let telemetry = subject.getPayload();
      expect(telemetry.taskStage).to.eq("createContext");
    });

    it('should overwrite the task stage when recorded multiple times', () => {
      // arrange
      testUtil.loadData();
      // act
      subject.recordStage("stage1");
      subject.recordStage("stage2");
      // assert
      let telemetry = subject.getPayload();
      expect(telemetry.taskStage).to.eq("stage2");
    });

  });

});