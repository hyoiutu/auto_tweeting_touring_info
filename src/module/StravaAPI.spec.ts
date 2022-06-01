import { StravaAPI } from "./StravaAPI";
import { stravaAxios } from "../axios";
import fs from "fs";
import { exec } from "child_process";

beforeAll(() => {
  StravaAPI.prototype["readAccessToken"] = jest
    .fn()
    .mockReturnValue("example-access-token");
  StravaAPI.prototype["writeAccessToken"] = jest
    .fn()
    .mockImplementation((accessToken) => {
      fs.writeFileSync("secrets/test-stravaAccessToken", accessToken);
    });
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
      });
    });
    describe("アクセストークンの期限が切れていない場合", () => {
      beforeEach(() => {
        jest.spyOn(stravaAxios, "get").mockResolvedValue({
          data: "hoge",
        });
      });
      it("ファイルから読み込まれたアクセストークンがインスタンス変数に代入される", async () => {
        const stravaAPI = await StravaAPI.build();
        expect(stravaAPI["accessToken"]).toBe("example-access-token");
      });
    });
  });

  describe("getActivityDetailById", () => {
    const stravaAPI = new StravaAPI();
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
        const result = await stravaAPI.getActivityDetailById("validActivityId");
        expect(result).toStrictEqual({ activity: "example" });
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

afterAll(() => {
  exec("rm ./secrets/test-stravaAccessToken");
});
