import { createHash } from 'crypto';

export class TelemetryPayloadBuilder {
  payload: any;

  constructor() {
    this.payload = {};
  }

  add(name : string, value: any, defaultValue: any = null) { // todo: remove default value handling if not needed
    if (value !== undefined && value !== null && value !== defaultValue) {
      this.payload[name] = value;
    }
  }
  recordAnonymizedValue(name: string, value: string) {
    this.payload[name] = createHash('sha256').update(value).digest('hex');
  }
  recordNonDefaultValue(name: string) {
    this.payload[`${name}_custom`] = true;
  }

  getPayload() : any {
    return this.payload;
  }
}