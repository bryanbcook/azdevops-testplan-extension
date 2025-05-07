function jsonStringifyReplacer(key: string, value: any) {
  if (value instanceof Map) {
    return Object.fromEntries(value);
  }
  if (Array.isArray(value)) {
    return [...value];
  }
  return value;
}

export function JSONStringify(obj: any): string {
  return JSON.stringify(obj, jsonStringifyReplacer);
}