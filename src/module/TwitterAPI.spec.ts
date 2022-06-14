import { TwitterAPI } from "./TwitterAPI";
import { twitterAxios } from "../axios";

describe("TwitterAPI.ts", () => {
  describe("build", () => {
    describe("アクセストークンの期限が切れていた場合", () => {
      beforeEach(() => {
        jest.spyOn(twitterAxios, "get").mockRejectedValue({
          response: {
            data: {
              status: 401,
              title: "Unauthorized",
            },
          },
        });
        jest.spyOn(twitterAxios, "post").mockImplementation(async (url) => {
          if (url === "/oauth2/token") {
            return {
              data: {
                access_token: "new-access-token",
                refresh_token: "new-refresh-token",
              },
            };
          }

          throw new Error("ここに入らない想定");
        });
      });

      it("新しいアクセストークンとリレッシュトークンに書き換わる", async () => {
        const twitterAPI = await TwitterAPI.build();
        expect(twitterAPI["accessToken"]).toBe("new-access-token");
        expect(twitterAPI["refreshToken"]).toBe("new-refresh-token");
        expect(process.env["TWITTER_API_ACCESS_TOKEN"]).toBe(
          "new-access-token"
        );
        expect(process.env["TWITTER_API_REFRESH_TOKEN"]).toBe(
          "new-refresh-token"
        );
      });
      afterEach(() => {
        process.env["TWITTER_API_ACCESS_TOKEN"] = "example-access-token";
        process.env["TWITTER_API_REFRESH_TOKEN"] = "example-refresh-token";
      });
    });

    describe("アクセストークンの期限が切れていない場合", () => {
      beforeEach(() => {
        jest.spyOn(twitterAxios, "get").mockResolvedValue({
          data: {
            hoge: "fuga",
          },
        });
      });
      it("既存のアクセストークンとリフレッシュトークンを取得している", async () => {
        const twitterAPI = await TwitterAPI.build();
        expect(twitterAPI["accessToken"]).toBe("example-access-token");
        expect(twitterAPI["refreshToken"]).toBe("example-refresh-token");
        expect(process.env["TWITTER_API_ACCESS_TOKEN"]).toBe(
          "example-access-token"
        );
        expect(process.env["TWITTER_API_REFRESH_TOKEN"]).toBe(
          "example-refresh-token"
        );
      });
    });
  });
});
