
export class configAlias {
    public alias: string;
    public config: string;

    constructor(alias: string, config: string) {
        this.alias = alias.trim();
        this.config = config.replace(/["']/g, "");
    }
}
