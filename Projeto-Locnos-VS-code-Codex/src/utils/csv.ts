import Papa, { type ParseResult } from "papaparse";

export interface CsvPreview<T> {
  headers: string[];
  rows: T[];
}

export const parseCsv = async <T>(file: File): Promise<CsvPreview<T>> => {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<T>) => {
        const headers = results.meta.fields ?? [];
        resolve({ headers, rows: results.data as T[] });
      },
      error: (error: Error) => reject(error)
    });
  });
};
