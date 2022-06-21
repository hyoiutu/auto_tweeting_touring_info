import fs from "fs";
import { exec } from "child_process";
import * as csv from "csv-parser";
import sharp from "sharp";
import * as file from "./file";

export function writeAPIResToJSON(path: string, json: string) {
  try {
    fs.writeFileSync(path, json);
    console.log(`wrote to ${path}`);
  } catch (err) {
    console.error(err);
  }
}

export function readJSONFromFile(path: string) {
  try {
    const data = fs.readFileSync(path, "utf-8");
    console.log(`read from ${path}`);

    return data;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function downloadTopoJSONs(codes: string[]) {
  const downloadCodes = [...new Set(codes)].filter(
    (code) => !fs.existsSync(`./topojson/${code}_city.i.topojson`)
  );
  for (const code of downloadCodes) {
    if (code) {
      const fileName = `${code}_city.i.topojson`;
      await exports.downloadFile(
        "./topojson",
        `https://geoshape.ex.nii.ac.jp/city/topojson/20210101/${code}/${fileName}`
      );
    }
  }
}

export async function downloadFile(
  path: string,
  url: string,
  fileName?: string
) {
  const command = fileName
    ? `wget -O ${path}/${fileName} ${url}`
    : `wget -P ${path} ${url}`;
  await new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) {
        console.error(stderr);
        reject(err);
      } else {
        console.log(`${url} was downloaded`);
        resolve(stdout);
      }
    });
  });
}

export async function regionsToCodes(regions: string[]): Promise<string[]> {
  const result = await file.csvParse<{ code: string; prefecture: string }>(
    "./csv/pref_code.csv"
  );
  const prefs = regions.map((region) => {
    const result = region.match(/(^京都府)|(.+?[都道府県])/);
    return result ? result[0] : undefined;
  });
  const codes = prefs.map((pref) => {
    return result.find((record) => {
      return record.prefecture === pref;
    })?.code;
  });

  return [...new Set(codes)].filter(
    (v): v is Exclude<typeof v, undefined> => v !== undefined
  );
}

export async function csvParse<T>(fileName: string): Promise<Array<T>> {
  const results: Array<T> = [];
  return await new Promise((resolve, reject) => {
    const rs = fs.createReadStream(fileName, "utf-8").pipe(csv.default());
    rs.on("data", (data: T) => {
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

export async function svgToPng(inputPath: string, outputPath: string) {
  await sharp(inputPath).png().toFile(outputPath);
}
