import * as tl from 'azure-pipelines-task-lib/task';
import { TelemetryPayloadBuilder } from './TelemetryPayloadBuilder';

interface TaskTelemetryOptions {
  recordNonDefault?: boolean; /* capture that the user has supplied a custom value for an input, but not the value */
  recordValue?: boolean; /* capture the actual value supplied for an input */
  anonymize?: boolean; /* capture an anonymized version of the user supplied value */
}

export class TaskParameterHelper {
  payloadBuilder: TelemetryPayloadBuilder;

  constructor(payloadBuilder: TelemetryPayloadBuilder) {
    this.payloadBuilder = payloadBuilder;
  }

  /* Fetches an input parameter, falling back to a default value if not specified.
    param name: The name of the input parameter
    param fallback: A function that returns the default value to use if the input is not specified
    param recordNonDefault: Whether to record in telemetry that a non-default value was used
    param recordValue: Whether to record the value in telemetry
    param anonymize: Whether to anonymize the value when recording in telemetry
    returns: The input parameter value, or the default value if not specified
  */
  getInputOrFallback(name: string, fallback: () => string | undefined, options: TaskTelemetryOptions = {}) : string {
    let value = tl.getInput(name, false);
    if (value === undefined || value === null || value.length == 0) {
      tl.debug(`input '${name}' not specified. using default value.`);
      value = fallback();
    } else if (options.recordNonDefault) {
      this.payloadBuilder.recordNonDefaultValue(name);
    }
    if (options.recordValue || options.anonymize) {
      if (options.anonymize) {
        this.payloadBuilder.recordAnonymizedValue(name, value!);
      } else {
        this.payloadBuilder.add(name, value);
      }
    }
    return value!;
  }

  /* Expose the telemetry payload */
  getPayload(err? : any) : any { // todo: specify privacy level
    // todo: enrich payload with additional info (task version, os, etc)
    this.payloadBuilder.recordError(err);
    return this.payloadBuilder.getPayload(); // todo: specify privacy level
  }
}