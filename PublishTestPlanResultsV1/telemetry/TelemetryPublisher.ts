import { TelemetryPublisherParameters } from "./TelemetryPublisherParameters";
import { getLogger, ILogger } from '../services/Logger';

export class TelemetryPublisher {
  logger: ILogger;

  static getInstance() : TelemetryPublisher {
    return new TelemetryPublisher(getLogger());
  }

  constructor(logger: ILogger) {
    this.logger = logger || getLogger();
  }

  async publish(parameters: TelemetryPublisherParameters) : Promise<void> {
    try {
      this.#displayTelemetry(parameters);
    }
    catch (err) {
      // swallow telemetry errors
      this.#dumpError(err, parameters.displayTelemetryErrors);
    }
  }

  #displayTelemetry(parameters: TelemetryPublisherParameters) {
    if (parameters.displayTelemetryPayload) {
      // dump telemetry payload to console for debugging
      this.logger.info("Telemetry Payload:");
      this.logger.info(JSON.stringify(parameters.payload, null, 2));
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
