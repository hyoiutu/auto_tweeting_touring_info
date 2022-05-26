import fs from "fs";

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
