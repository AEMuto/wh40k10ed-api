import Papa, { ParseConfig } from "papaparse";

/**
 * A generic, reusable CSV parser using PapaParse.
 * @param csvContent The raw string content of the CSV file.
 * @param options The configuration object for PapaParse.
 * @returns An array of parsed objects.
 */
export function parseCsvString<T>(
  csvContent: string,
  options: ParseConfig
): T[] {
  const { data } = Papa.parse<T>(csvContent, options);
  return data;
}
