import { createHash } from 'crypto';

export class TelemetryPayloadBuilder {
  payload: any; // todo: use different payloads for privacy levels

  constructor() {
    this.payload = {};
  }

  /* Add a telemetry element to the payload */
  add(name : string, value: any) { // todo: privacy level
    if (value !== undefined && value !== null) {
      this.payload[name] = value;
    }
  }

  /* Record an anonymized value in the payload */
  recordAnonymizedValue(name: string, value: string) {
    this.payload[name] = createHash('sha256').update(value).digest('hex');
  }

  /* Record that a task input was set to a non-default value */
  recordNonDefaultValue(name: string) {
    this.payload[`${name}_custom`] = true;
  }

  /* Record the details of an error in the payload */
  recordError(err?: any) {
    if (err) {
      if (err instanceof Error) {
        this.payload["errorMessage"] = err.message;
        this.payload["errorStack"] = err.stack;
      } else {
        this.payload["errorMessage"] = JSON.stringify(err);
      }
    }
  }

  /* Fetch the contents of the constructed telemetry payload */
  getPayload() : any {
    return this.payload; // todo: combine payloads for different privacy levels
  }
}