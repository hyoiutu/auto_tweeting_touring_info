import * as fileModule from "./file";
import fs, { writeFileSync } from "fs";
import { getEnv } from "./env";

const testDir = getEnv("TEST_FILES_DIR");

beforeAll(() => {
  const svgSource = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30">
  <path d="M10,10L20,20Z" style="stroke: #000000; stroke-width: 0.1; fill: #ffffff;"></path>
</svg>`;
  // テスト用のSVGファイル
  if (!fs.existsSync(`${testDir}/test.svg`)) {
    writeFileSync(`${testDir}/test.svg`, svgSource);
  }
});

describe("file.ts", () => {
  const filePath = `./${testDir}/testFile.json`;

  describe("writeAPIResToJSON", () => {
    const validJSON = "{data: 'hoge'}";

    it("ファイルに書き込まれる", () => {
      fileModule.writeAPIResToJSON(filePath, "{data: 'hoge'}");
      const result = fs.readFileSync(filePath, "utf-8");
      expect(result).toBe(validJSON);
    });
  });
  describe("readJSONFromFile", () => {
    const expectJSON = "{data: 'hoge'}";
    it("ファイルが読まれる", () => {
      const result = fileModule.readJSONFromFile(filePath);
      expect(result).toBe(expectJSON);
    });
  });
  describe("downloadTopoJSONs", () => {
    beforeEach(() => {
      jest.spyOn(fileModule, "downloadFile").mockResolvedValue();
    });
    describe("[01,01,02,02,03]のような重複のある引数を渡した場合", () => {
      it("重複が取り除かれてダウンロードされる", async () => {
        await fileModule.downloadTopoJSONs([
          "test_01",
          "test_01",
          "test_02",
          "test_02",
          "test_03",
        ]);
        expect.assertions(4);
        expect(fileModule.downloadFile).toBeCalledTimes(3);
        expect(fileModule.downloadFile).toBeCalledWith(
          "./topojson",
          "https://geoshape.ex.nii.ac.jp/city/topojson/20210101/test_01/test_01_city.i.topojson"
        );
        expect(fileModule.downloadFile).toBeCalledWith(
          "./topojson",
          "https://geoshape.ex.nii.ac.jp/city/topojson/20210101/test_02/test_02_city.i.topojson"
        );
        expect(fileModule.downloadFile).toBeCalledWith(
          "./topojson",
          "https://geoshape.ex.nii.ac.jp/city/topojson/20210101/test_03/test_03_city.i.topojson"
        );
      });
    });
    describe("ダウンロード済みのファイルが対象になっている場合", () => {
      beforeEach(() => {
        jest.spyOn(fs, "existsSync").mockImplementation((path: fs.PathLike) => {
          return /(test_01|test_03)/.test(path.toString());
        });
      });
      it("ダウンロード済みのファイルはスキップされる", async () => {
        await fileModule.downloadTopoJSONs(["test_01", "test_02", "test_03"]);
        expect.assertions(2);
        expect(fileModule.downloadFile).toBeCalledTimes(1);
        expect(fileModule.downloadFile).toBeCalledWith(
          "./topojson",
          "https://geoshape.ex.nii.ac.jp/city/topojson/20210101/test_02/test_02_city.i.topojson"
        );
      });
    });
  });
  describe("downloadFile", () => {
    describe("実行コマンド側でエラー起きたとき", () => {
      it("rejecetされる", async () => {
        await expect(
          fileModule.downloadFile("./topojson", "invalid_url")
        ).rejects.toThrow();
      });
    });
    describe("正常に実行できたとき", () => {
      it("ファイルが保存される", async () => {
        await fileModule.downloadFile(
          testDir,
          "https://geoshape.ex.nii.ac.jp/city/topojson/20210101/01/01_city.i.topojson",
          "test.topojson"
        );
        expect(fs.existsSync(`./${testDir}/test.topojson`)).toBeTruthy();
      });
    });
  });

  describe("regionsToCodes", () => {
    beforeEach(() => {
      jest.spyOn(fileModule, "csvParse").mockResolvedValue([
        { code: "test_01", prefecture: "京都府" },
        { code: "test_02", prefecture: "千葉県" },
        { code: "test_03", prefecture: "東京都" },
      ]);
    });
    describe("京都府のように都道府県名に都/道/府/県いずれかの文字が入っている場合", () => {
      it("京都府を取り出しcodeを返す", async () => {
        const codes = await fileModule.regionsToCodes(["京都府京都市"]);
        expect(codes).toHaveLength(1);
        expect(codes[0]).toBe("test_01");
      });
    });
    describe("千葉県四街道市のように市町村名に都/道/府/県いずれかの文字が入っている場合", () => {
      it("千葉県を取り出しcodeを返す", async () => {
        const codes = await fileModule.regionsToCodes(["千葉県四街道市"]);
        expect(codes).toHaveLength(1);
        expect(codes[0]).toBe("test_02");
      });
    });
    describe("同じ都道府県名が渡された場合", () => {
      it("重複なしでcodeを返す", async () => {
        const codes = await fileModule.regionsToCodes([
          "東京都渋谷区",
          "東京都新宿区",
        ]);
        expect(codes).toHaveLength(1);
        expect(codes[0]).toBe("test_03");
      });
    });
  });
  describe("csvParse", () => {
    beforeEach(() => {
      fs.writeFileSync(`./${testDir}/test.csv`, "key,value\nhogeKey,hogeValue");
    });
    it("パースしたCSVに対してオブジェクトが返ってくる", async () => {
      const result = await fileModule.csvParse<{
        key: string;
        value: string;
      }>(`./${testDir}/test.csv`);
      expect(result).toHaveLength(1);
      expect(result[0]).toStrictEqual({ key: "hogeKey", value: "hogeValue" });
    }, 6000);
  });
  describe("svgToPng", () => {
    it("pngが返ってくる", async () => {
      await fileModule.svgToPng(`${testDir}/test.svg`, `${testDir}/test.png`);
      expect(fs.existsSync(`${testDir}/test.png`)).toBeTruthy();
    });
  });
});
