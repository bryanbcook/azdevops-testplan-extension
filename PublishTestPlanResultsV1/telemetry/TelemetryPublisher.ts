import { TelemetryPublisherParameters } from "./TelemetryPublisherParameters";
import { getLogger, ILogger } from '../services/Logger';
import * as appInsights from 'applicationinsights';

let connectionString = '<<APPINSIGHTS_CONNECTIONSTRING>>';

export class TelemetryPublisher {

  logger: ILogger;
  client: appInsights.TelemetryClient;

  static getInstance() : TelemetryPublisher {

    const logger = getLogger();

    // support local debugging
    if (connectionString.startsWith("<<")) {
      connectionString = process.env['APPINSIGHTS_CONNECTIONSTRING'] || '';
      if (!connectionString) {
        logger.warn("Application Insights connection string is not set.");
        return new TelemetryPublisher(logger, {} as appInsights.TelemetryClient);
      }      
    }

    appInsights.setup(connectionString)
      // disable configuration elements that are not relevant, introduce performance cost or potential privacy concerns
      .setAutoCollectConsole(false) // do not collect logs
      //.setAutoCollectExceptions(false) // handle uncaughtException or unhandledRejection
      .setAutoCollectHeartbeat(false) // not relevant for short-lived processes
      .setAutoCollectIncomingRequestAzureFunctions(false) // not relevant as there are no incoming requests
      .setAutoCollectPerformance(false) // not relevant for short-lived processes
      .setAutoCollectPreAggregatedMetrics(false) // not relevant for short-lived processes
      .setAutoCollectRequests(false) // not relevant as there are no incoming requuests
      .setAutoDependencyCorrelation(false) // correlation ids have no meaning in services that are not under our control     
      .setInternalLogging(false, false) // disable internal logging
      .setSendLiveMetrics(false) // disable live metrics
      .setUseDiskRetryCaching(false) // disable disk caching for network issues
      
      // TODO: enable profiling for dependencies using a feature flag
      // TODO: add telemetry processor to mask customer server urls + ado organization/project details
      // TODO: instrument ado api calls with correlation ids as trackEvent does not do this automatically
      // TODO: ensure that post-body or sensitive data is not sent in any dependency telemetry
      .setAutoCollectDependencies(false)
      .start();
    
    const client = appInsights.defaultClient;

    return new TelemetryPublisher(logger, client);
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
      this.logger.debug("publishing telemetry event.");
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
