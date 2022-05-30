import { writeAPIResToJSON, readJSONFromFile } from "./file";
import { exec } from "child_process";
import fs from "fs";

const filePath = "./testFile.json";

describe("file.ts", () => {
  describe("writeAPIResToJSON", () => {
    const validJSON = "{data: 'hoge'}";

    it("ファイルに書き込まれる", () => {
      writeAPIResToJSON({ path: filePath, json: "{data: 'hoge'}" });
      const result = fs.readFileSync(filePath, "utf-8");
      expect(result).toBe(validJSON);
    });
  });
  describe("readJSONFromFile", () => {
    const expectJSON = "{data: 'hoge'}";
    it("ファイルが読まれる", () => {
      const result = readJSONFromFile(filePath);
      expect(result).toBe(expectJSON);
    });
  });
});

afterAll(() => {
  exec(`rm ${filePath}`);
});
