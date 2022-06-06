import fs from "fs";
import { exec } from "child_process";
import * as csv from "csv-parser";

export type WriteAPIResToJSONArgs = {
  json: string;
  path: string;
};

export function writeAPIResToJSON(arg: WriteAPIResToJSONArgs) {
  try {
    fs.writeFileSync(arg.path, arg.json);
    console.log(`wrote to ${arg.path}`);
  } catch (err) {
    console.error(err);
  }
}

export function readJSONFromFile(path: string) {
  return fs.readFileSync(path, "utf-8");
}

export async function downloadTopoJSONsByRegionNames(regionNames: string[]) {
  const result = await csvParse("./csv/pref_code.csv");
  console.log(result);
}

export async function csvParse(fileName: string) {
  const results: unknown[] = [];
  return await new Promise((resolve, reject) => {
    const rs = fs.createReadStream(fileName, "utf-8").pipe(csv.default());
    rs.on("data", (data) => {
      results.push(data);
    });
    rs.on("end", () => {
      resolve(results);
    });
    rs.on("error", (err) => {
      reject(err);
    });
  });
}
