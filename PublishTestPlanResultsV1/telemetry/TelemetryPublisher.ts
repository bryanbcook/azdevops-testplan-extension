import { TelemetryPublisherParameters } from "./TelemetryPublisherParameters";
import { getLogger, ILogger } from '../services/Logger';
import * as appInsights from 'applicationinsights';

const connectionString = '<<APPINSIGHTS_CONNECTIONSTRING>>';

export class TelemetryPublisher {

  logger: ILogger;
  client: appInsights.TelemetryClient;

  static getInstance() : TelemetryPublisher {
    appInsights.setup(connectionString).start();
    const client = appInsights.defaultClient;
    return new TelemetryPublisher(getLogger(), client);
  }

  constructor(logger: ILogger, client: appInsights.TelemetryClient) {
    this.logger = logger || getLogger();
    this.client = client;
  }

  async publish(parameters: TelemetryPublisherParameters) : Promise<void> {
    try {
      this.#displayTelemetry(parameters);
      this.#publishEvent(parameters);
    }
    catch (err) {
      // swallow telemetry errors
      this.#dumpError(err, parameters.displayTelemetryErrors);
    }
  }

  dispose() {
    appInsights.dispose();
  }

  #displayTelemetry(parameters: TelemetryPublisherParameters) {
    if (parameters.displayTelemetryPayload) {
      // dump telemetry payload to console for debugging
      this.logger.info("Telemetry Payload:");
      this.logger.info(JSON.stringify(parameters.payload, null, 2));
    }
  }

  #publishEvent(parameters: TelemetryPublisherParameters) {
    if (parameters.publishTelemetry) {
      this.client.trackEvent({ name: "PublishTestPlanResults", properties: parameters.payload });
      this.client.flush();
    }    
  }

  #dumpError(err: any, enabled: boolean | undefined) {
    // only show telemtry errors when feature flag is enabled
    if (enabled) {
      this.logger.warn("Exception occured while publishing telemetry:");
      this.logger.info("----------------------------------------");
      if (err instanceof Error) {
        this.logger.info(`Typed error: ${err.message}\n${err.stack}`);
      } else {
        this.logger.info(`Telemetry error: ${JSON.stringify(err)}`);
      }
    }
  }
}

export default TelemetryPublisher.getInstance();
