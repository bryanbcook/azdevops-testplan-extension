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
    param TaskTelemetryOptions: Options for telemetry recording
      - recordNonDefault: Whether to record in telemetry that a non-default value was used
      - recordValue: Whether to record the value in telemetry
      - anonymize: Whether to anonymize the value when recording in telemetry
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

  /* Fetches an input parameter that does not have a fallback value.
    param name: The name of the input parameter
    param required: Whether the input parameter is required
    param TaskTelemetryOptions: Options for telemetry recording
      - recordNonDefault: Whether to record in telemetry that a non-default value was used
      - recordValue: Whether to record the value in telemetry
    returns: The input parameter value, or undefined if not specified
  */
  getInput(name: string, required: boolean, options: TaskTelemetryOptions = {}) : string | undefined {
    let value = tl.getInput(name, required);
    
    if (value !== undefined) {
      // optional: record value if not undefined
      if (options.recordValue) {
        this.payloadBuilder.add(name, value);
      }
      // optional: record that custom value was provided
      if (options.recordNonDefault) {
        this.payloadBuilder.recordNonDefaultValue(name);
      }
    }
    
    return value;
  }

  getBoolInput(name: string, defaultValue: boolean, options: TaskTelemetryOptions = {}) : boolean {
    // check if input is provided
    let input = tl.getInput(name, false);

    // if value is provided
    if (input !== undefined) {
      // parse as boolean and record telemetry options
      let boolValue = input.toUpperCase() == "TRUE";
      if (options.recordValue) {
        this.payloadBuilder.add(name, boolValue);
      }
      if (options.recordNonDefault) {
        this.payloadBuilder.recordNonDefaultValue(name);
      }
      return boolValue;
    }
    else {
      return defaultValue;
    }
  }

  /* Fetches a delimited input parameter as an array of strings.
    param name: The name of the input parameter
    param TaskTelemetryOptions: Options for telemetry recording
      - recordNonDefault: Whether to record in telemetry that a non-default value was used
      - recordValue: Whether to record the value in telemetry
    returns: The input parameter value as an array of strings
  */
  getDelimitedInput(name: string, options: TaskTelemetryOptions = {}) : string[] {
    let values = tl.getDelimitedInput(name, ",", false);
    if (values.length > 0) {
      // optional: record value if not undefined
      if (options.recordValue) {
        this.payloadBuilder.add(name, values.join(","));
      }
      // optional: record that custom value was provided
      if (options.recordNonDefault) {
        this.payloadBuilder.recordNonDefaultValue(name);
      }
    }
    return values;
  }

  /* record the current stage of the task */
  recordStage(stage: string) {
    this.payloadBuilder.add("taskStage", stage);
  }

  /* Expose the telemetry payload */
  getPayload(err? : any) : any { // todo: specify privacy level
    // todo: enrich payload with additional info (task version, os, etc)
    this.payloadBuilder.recordError(err);
    return this.payloadBuilder.getPayload(); // todo: specify privacy level
  }
}