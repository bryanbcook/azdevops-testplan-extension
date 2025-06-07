// compatibility fix for node10 as ?? is not supported
export function coalesce(value: string | undefined, defaultValue: string): string {
    return value ? value : defaultValue;
}