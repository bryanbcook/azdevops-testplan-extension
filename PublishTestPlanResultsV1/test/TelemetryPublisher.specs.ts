import sinon, { SinonStubbedInstance } from "sinon";
import { ILogger, NullLogger } from "../services/Logger";
import { TelemetryPublisher } from "../telemetry/TelemetryPublisher";
import { FeatureFlag } from "../services/FeatureFlags";
import { TelemetryPublisherParameters } from "../telemetry/TelemetryPublisherParameters";
import { TelemetryClient } from "applicationinsights";

describe('TelemetryPublisher', () => {

  var subject : TelemetryPublisher;
  var loggerStub : SinonStubbedInstance<ILogger>;
  var parameters: TelemetryPublisherParameters;
  var telemetryClientStub: SinonStubbedInstance<TelemetryClient>;

  beforeEach(() => {
    loggerStub = sinon.createStubInstance<ILogger>(NullLogger);
    telemetryClientStub = sinon.createStubInstance<TelemetryClient>(TelemetryClient);
    subject = new TelemetryPublisher(loggerStub as ILogger, telemetryClientStub as TelemetryClient);
    parameters = new TelemetryPublisherParameters();
    parameters.publishTelemetry = true; // TODO: remove with featureflag
  });

  it('should swallow any errors that occur when publishing telemetry', async () => {
    // arrange
    parameters.payload = { testKey: "testValue" };
    telemetryClientStub.trackEvent.throws(new Error("test error"));

    // act / assert - no exception thrown
    await subject.publish(parameters);    
  });

  context(`FeatureFlag: ${FeatureFlag.DisplayTelemetryErrors}`, () => {

    it('should log telemetry errors that occurr when feature flag is enabled (Error)', async () => {
      // arrange
      parameters.displayTelemetryErrors = true;
      parameters.payload = { testKey: "testValu e" };
      telemetryClientStub.trackEvent.throws(new Error("test error"));

      // act
      await subject.publish(parameters);

      // assert
      sinon.assert.calledWith(loggerStub.warn, "Exception occured while publishing telemetry:");
      sinon.assert.calledWith(loggerStub.info, sinon.match.string.and(sinon.match(/test error/)));
    });

    it('should log telemetry errors that occurr when feature flag is enabled (string)', async () => {
      // arrange
      parameters.displayTelemetryErrors = true;
      parameters.payload = { testKey: "testValu e" };
      telemetryClientStub.trackEvent.callsFake( () => { throw "error string"; } );

      // act
      await subject.publish(parameters);

      // assert
      console.log('All logger.info calls:', loggerStub.info.getCalls().map(call => call.args));
      sinon.assert.calledWith(loggerStub.info, sinon.match.string.and(sinon.match(/error string/)));
    });

  });
 
  context(`FeatureFlag: ${FeatureFlag.PublishTelemetry}`, () => {

    it('should publish telemetry when feature flag is enabled', async () => {
      // arrange
      parameters.publishTelemetry = true;
      parameters.payload = { testKey: "testValue" };

      // act
      await subject.publish(parameters);

      // assert
      sinon.assert.calledOnce(telemetryClientStub.trackEvent);
      sinon.assert.calledWith(telemetryClientStub.trackEvent, sinon.match.has("name", "PublishTestPlanResults"));
    });

    it('should not publish telemetry when feature flag is disabled', async () => {
      // arrange
      parameters.publishTelemetry = false;
      parameters.payload = { testKey: "testValue" };

      // act
      await subject.publish(parameters);

      // assert
      sinon.assert.notCalled(telemetryClientStub.trackEvent);
    });
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