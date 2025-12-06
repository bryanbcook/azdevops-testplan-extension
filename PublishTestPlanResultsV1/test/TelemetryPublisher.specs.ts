import sinon, { SinonStubbedInstance } from "sinon";
import { ILogger, NullLogger } from "../services/Logger";
import { TelemetryPublisher } from "../telemetry/TelemetryPublisher";
import { FeatureFlag } from "../services/FeatureFlags";
import { TelemetryPublisherParameters } from "../telemetry/TelemetryPublisherParameters";

describe('TelemetryPublisher', () => {

  var subject : TelemetryPublisher;
  var loggerStub : SinonStubbedInstance<ILogger>;
  var parameters: TelemetryPublisherParameters;

  beforeEach(() => {
    loggerStub = sinon.createStubInstance<ILogger>(NullLogger);
    subject = new TelemetryPublisher(loggerStub as ILogger);
    parameters = new TelemetryPublisherParameters();
  });

  // errors that occur when publishing are swallowed
  // it('should swallow errors when publishing telemetry', async () => {
  //   // arrange
  // });

  it('temp: no side-effects when publish is called', async () => { // todo: remove when services added
    // act
    await subject.publish(parameters);
  });

  context(`FeatureFlag: ${FeatureFlag.DisplayTelemetry}`, () => {

    it('should log telemetry payload when feature flag is enabled', async () => {
      // arrange
      parameters.displayTelemetryPayload = true;
      parameters.payload = { testKey: "testValue" };

      // act
      await subject.publish(parameters);

      // assert
      sinon.assert.calledWith(loggerStub.info, "Telemetry Payload:");
      sinon.assert.calledWith(loggerStub.info, JSON.stringify(parameters.payload, null, 2));
    });
  });

});