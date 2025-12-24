import { createHash } from 'crypto';

const { v4: uuidv4 } = require('uuid');
const correlationId = uuidv4();
const task = require('../task.json');

export enum PrivacyLevel {
  Minimum = 0,
  Normal = 1
}

export class TelemetryPayloadBuilder {
  basepayload: any; // minimum payload
  payload: any; // other payload details

  constructor() {
    this.basepayload = {};
    this.payload = {};
  }

  /* Add a telemetry element to the payload */
  add(name : string, value: any, privacyLevel: PrivacyLevel = PrivacyLevel.Normal) {
    if (value !== undefined && value !== null) {
      if (privacyLevel === PrivacyLevel.Minimum) {
        this.basepayload[name] = value;
      } else {
        this.payload[name] = value;
      }     
    }
  }

  /* Record an anonymized value in the payload */
  recordAnonymizedValue(name: string, value: string, privacyLevel: PrivacyLevel = PrivacyLevel.Minimum) {
    let unreversableValue = createHash('sha256').update(value).digest('hex');

    if (privacyLevel === PrivacyLevel.Minimum) {
      this.basepayload[name] = unreversableValue;
    } else {
      this.payload[name] = unreversableValue;
    }
  }

  /* Record that a task input was set to a non-default value */
  recordNonDefaultValue(name: string, privacyLevel: PrivacyLevel = PrivacyLevel.Normal) {
    let key = `${name}_custom`;
    if (privacyLevel === PrivacyLevel.Minimum) {
      this.basepayload[key] = true;
    } else {
      this.payload[key] = true;
    }
  }

  /* Record the details of an error in the payload */
  recordError(err?: any) {
    if (err) {
      if (err instanceof Error) {
        this.payload["errorMessage"] = err.message;
        this.payload["errorStack"] = this.#formatStackTrace(err.stack);
      } else {
        this.payload["errorMessage"] = JSON.stringify(err);
      }
    }
  }

  /* Fetch the contents of the constructed telemetry payload */
  getPayload(optOut: boolean = false) : any {
    this.add("correlationId", correlationId, PrivacyLevel.Normal);
    this.add("nodeVersion", process.version, PrivacyLevel.Normal);
    this.add("taskVersion", `${task.version.Major}.${task.version.Minor}.${task.version.Patch}`, PrivacyLevel.Minimum);

    if (optOut) {
      return this.basepayload;
    } else {
      return {
        ...this.basepayload,
        ...this.payload
      };
    }
  }

  #formatStackTrace(stack: string | undefined) : string[] | undefined {
    if (stack === undefined) {
      return undefined;
    }
    return stack.split('\n').map(line => line.trim())
  }
}