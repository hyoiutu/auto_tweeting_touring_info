import { execSync } from "child_process";
import fs from "fs";
import { getEnv, overWrittenSecretsEnvs, setSecretsEnvs } from "./env";

const secretsDir = `${getEnv("TEST_FILES_DIR")}/secrets`;

beforeAll(() => {
  if (!fs.existsSync(secretsDir)) {
    execSync(`mkdir ${secretsDir}`);
  }
  fs.writeFileSync(`${secretsDir}/TEST_SECRET_ENV`, "test_secret_env");

  process.env["TEST_ENV"] = "test_env";
});

describe("env.ts", () => {
  describe("getEnv", () => {
    describe("存在しない環境変数を指定した場合", () => {
      it("環境変数が存在しないエラーが投げられる", () => {
        expect(() => {
          getEnv("INVALID_ENV");
        }).toThrow("INVALID_ENV is not exist");
      });
    });
    describe("存在する環境変数を指定した場合", () => {
      it("環境変数の中身が返ってくる", () => {
        expect(getEnv("TEST_ENV")).toBe("test_env");
      });
    });
  });
  describe("setSecretsEnv", () => {
    describe("存在しないディレクトリを指定した場合", () => {
      it("パスが存在しないエラーが投げられる", () => {
        expect(() => {
          setSecretsEnvs("./invalidDir");
        }).toThrow("./invalidDir is not exist");
      });
    });
    describe("存在するディレクトリを指定した場合", () => {
      beforeEach(() => {
        setSecretsEnvs(secretsDir);
      });
      it("ディレクトリ内の各ファイルからデータを読み出して環境変数に格納する", () => {
        expect(process.env["TEST_SECRET_ENV"]).toBe("test_secret_env");
      });
    });
  });
  describe("overWrittenSecretsEnvs", () => {
    describe("存在しない環境変数が対象になった場合", () => {
      beforeEach(() => {
        fs.writeFileSync(`${secretsDir}/invalidFile`, "invalidEnv");
      });
      it("環境変数が存在しないエラーが投げられる", () => {
        expect(() => {
          overWrittenSecretsEnvs(secretsDir);
        }).toThrow("invalidFile is not exist");
      });
      afterEach(() => {
        execSync(`rm ${secretsDir}/invalidFile`);
      });
    });
    describe("存在する環境変数のみ対象の場合", () => {
      beforeEach(() => {
        process.env["TEST_SECRET_ENV"] = "new_test_secret_env";
        overWrittenSecretsEnvs(secretsDir);
      });
      it("ファイルに保存されている環境変数が書き換わる", () => {
        expect(fs.readFileSync(`${secretsDir}/TEST_SECRET_ENV`, "utf-8")).toBe(
          "new_test_secret_env"
        );
      });
    });
  });
});
