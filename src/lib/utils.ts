import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const structurePromiseSettledResult = <T>(
  result: PromiseSettledResult<T>,
  defaultValue: T
) => {
  return result.status === "fulfilled" ? result.value : defaultValue;
};
