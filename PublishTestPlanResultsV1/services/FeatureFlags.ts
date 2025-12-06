export class FeatureFlag {
  static DisplayTelemetry : string = "displaytelemetry";
  static DisplayTelemetryErrors : string = "displaytelemetryerrors";
}

export class FeatureFlags {
  flags: Map<string,boolean>;

  constructor() {
    this.flags = this.#getFeatureFlags();
  }

  isFeatureEnabled(flagName: string) : boolean {
    return this.flags.get(flagName.toLowerCase()) ?? false;
  }

  getFlags() : string[] {
    return Array.from(this.flags.keys());
  }

  // for testing
  reload() {
    this.flags = this.#getFeatureFlags();
  }

  #getFeatureFlags() : Map<string,boolean> {
    const prefix = "PUBLISHTESTPLANRESULTS_";
    let featureFlags = new Map<string,boolean>();
    for(var envVar in process.env) {
      if (envVar.startsWith(prefix)) {
        let flagName = envVar.substring(prefix.length).toLowerCase();
        let flagValue = (process.env[envVar]?.toLowerCase() == "true");
        featureFlags.set(flagName, flagValue);
      }
    }
    return featureFlags;
  }
}

export default new FeatureFlags();