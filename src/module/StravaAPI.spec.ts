import { StravaAPI } from "./StravaAPI";
import { stravaAxios } from "../axios";
import fs from "fs";
import { getEnv } from "../util/env";
import * as file from "../util/file";

const testDir = getEnv("TEST_FILES_DIR");
beforeAll(() => {
  // eslint-disable-next-line quotes
  fs.writeFileSync(`${testDir}/testActivityId.json`, '{"test":"json"}');
});

describe("StravaAPI.ts", () => {
  describe("build", () => {
    describe("アクセストークンの期限が切れていた場合", () => {
      let stravaAPI: StravaAPI;
      beforeEach(async () => {
        jest
          .spyOn(stravaAxios, "post")
          .mockResolvedValue({ data: { access_token: "new-access-token" } });
        jest.spyOn(stravaAxios, "get").mockRejectedValue({
          response: {
            status: 401,
            data: {
              errors: [
                {
                  field: "access_token",
                  code: "invalid",
                },
              ],
            },
          },
        });

        stravaAPI = await StravaAPI.build();
      });
      it("新しいアクセストークンが代入される", () => {
        expect(stravaAPI["accessToken"]).toBe("new-access-token");
        expect(process.env["STRAVA_API_ACCESS_TOKEN"]).toBe("new-access-token");
      });
      afterEach(() => {
        process.env["STRAVA_API_ACCESS_TOKEN"] = "example-access-token";
      });
    });
    describe("アクセストークンの期限が切れていない場合", () => {
      beforeEach(() => {
        jest.spyOn(stravaAxios, "get").mockResolvedValue({
          data: "hoge",
        });
      });
      it("環境変数から読み込まれたアクセストークンがインスタンス変数に代入される", async () => {
        const stravaAPI = await StravaAPI.build();

        expect(stravaAPI["accessToken"]).toBe("example-access-token");
      });
    });
  });

  describe("getActivityDetailById", () => {
    beforeEach(() => {
      jest.spyOn(file, "writeAPIResToJSON").mockImplementation((path, json) => {
        const matcher = path.match(/.*\/(.*)/);
        if (!matcher || matcher.length < 2) {
          throw new Error("fileName is not match");
        }

        fs.writeFileSync(`${testDir}/${matcher[1]}`, json);
      });
      jest.spyOn(file, "readJSONFromFile").mockImplementation((path) => {
        const matcher = path.match(/.*\/(.*)/);
        if (!matcher || matcher.length < 2) {
          throw new Error("fileName is not match");
        }
        return fs.readFileSync(`${testDir}/${matcher[1]}`, "utf-8");
      });
    });
    const stravaAPI = new StravaAPI();
    describe("指定のIdに対してすでにjsonファイルが存在している場合", () => {
      beforeEach(() => {
        jest
          .spyOn(stravaAxios, "get")
          .mockResolvedValue({ data: { activity: "example" } });
        jest.spyOn(fs, "existsSync").mockReturnValue(true);
      });
      it("APIは呼ばずにJSONからデータを読む", async () => {
        const result = await stravaAPI.getActivityDetailById("testActivityId");
        expect(stravaAxios.get).not.toBeCalled();
        expect(result).toStrictEqual({ test: "json" });
      });
    });
    describe("指定のIdに対してjsonファイルが存在していない場合", () => {
      beforeEach(() => {
        jest
          .spyOn(stravaAxios, "get")
          .mockImplementation(async (path, options) => {
            if (options?.headers?.Authorization !== "Bearer validAccessToken") {
              throw new Error("invalid Access Token");
            }
            if (path !== "/activities/validActivityId") {
              throw new Error("invalid Activity ID");
            }

            return { data: { activity: "example" } };
          });
        jest.spyOn(fs, "existsSync").mockReturnValue(false);
      });
      describe("正しくないアクセストークンが渡されたとき", () => {
        it("エラーが起こる", async () => {
          stravaAPI["accessToken"] = "invalidAccessToken";

          await expect(
            stravaAPI.getActivityDetailById("validActivityId")
          ).rejects.toThrow("invalid Access Token");
        });
      });
      describe("存在しないActivityIDが渡されたとき", () => {
        it("エラーが起こる", async () => {
          stravaAPI["accessToken"] = "validAccessToken";

          await expect(
            stravaAPI.getActivityDetailById("invalidActivityId")
          ).rejects.toThrow("invalid Activity ID");
        });
      });
      describe("正しいアクセストークンが渡されたとき", () => {
        it("Activityが返ってくる", async () => {
          const result = await stravaAPI.getActivityDetailById(
            "validActivityId"
          );
          expect(result).toStrictEqual({ activity: "example" });
          const json = JSON.parse(
            fs.readFileSync(`./${testDir}/validActivityId.json`, "utf-8")
          );
          expect(json).toStrictEqual({ activity: "example" });
        });
      });
    });
  });
  describe("getActivities", () => {
    const stravaAPI = new StravaAPI();
    beforeEach(() => {
      jest.spyOn(stravaAxios, "get").mockImplementation(async (_, options) => {
        if (options?.headers?.Authorization !== "Bearer validAccessToken") {
          throw new Error("invalid Access Token");
        }

        return { data: [{ activity: "example" }, { activity: "example2" }] };
      });
    });
    describe("正しくないアクセストークンが渡されたとき", () => {
      it("エラーが起こる", async () => {
        stravaAPI["accessToken"] = "invalidAccessToken";

        await expect(stravaAPI.getActivities()).rejects.toThrow(
          "invalid Access Token"
        );
      });
    });
    describe("正しいアクセストークンが渡されたとき", () => {
      it("Activity Listが返ってくる", async () => {
        stravaAPI["accessToken"] = "validAccessToken";

        const result = await stravaAPI.getActivities();
        expect(result).toStrictEqual([
          { activity: "example" },
          { activity: "example2" },
        ]);
      });
    });
  });
});
