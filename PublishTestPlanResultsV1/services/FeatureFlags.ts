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