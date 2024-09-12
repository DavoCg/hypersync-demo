import { groupBy, mapValues } from "lodash";

export function addressToTopic(address: string): string {
  return "0x000000000000000000000000" + address.slice(2, address.length);
}

export async function sleep(wait: number) {
  return await new Promise((resolve) => setTimeout(resolve, wait));
}

export function byKey<T, K extends keyof T>(arr: T[], key: K): Record<string, T> {
  return mapValues(groupBy(arr, key as string), (group: T[]) => group[0]);
}

export function lower(x: string) {
  return x.toLowerCase();
}
