import { TwitterAPI } from "./TwitterAPI";
import { twitterAxios } from "../axios";
import fs from "fs";

describe("TwitterAPI.ts", () => {
  describe("getMyInfo", () => {
    it("自分のアカウント情報が返ってくる", async () => {
      const twitterAPI = await TwitterAPI.build();
      const result = await twitterAPI.getMyInfo();
      expect(result).toBeDefined();
    });
  });

  describe("build", () => {
    beforeEach(() => {
      TwitterAPI.prototype["readAccessToken"] = jest
        .fn()
        .mockReturnValue("example-access-token");
      TwitterAPI.prototype["readRefreshToken"] = jest
        .fn()
        .mockReturnValue("example-refresh-token");
      TwitterAPI.prototype["writeAccessToken"] = jest
        .fn()
        .mockImplementation((accessToken: string) => {
          fs.writeFileSync("secrets/test-twitterAPIAccessToken", accessToken);
        });
      TwitterAPI.prototype["writeRefreshToken"] = jest
        .fn()
        .mockImplementation((refreshToken: string) => {
          fs.writeFileSync("secrets/test-twitterAPIRefreshToken", refreshToken);
        });
    });

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
        expect(
          fs.readFileSync("secrets/test-twitterAPIAccessToken", "utf-8")
        ).toBe("new-access-token");
        expect(
          fs.readFileSync("secrets/test-twitterAPIRefreshToken", "utf-8")
        ).toBe("new-refresh-token");
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
      });
    });
  });
});
/*


        })
    /*

      afterEach(() => {
        (twitterAxios.get as jest.Mock).mockRestore();
      });
    });


    afterEach(() => {
      jest.resetModules();
    });
    */
/*
describe("getMyInfo", () => {
  it("自分のアカウント情報が返ってくる", async () => {
    const twitterAPI = await TwitterAPI.build();
    const result = await twitterAPI.getMyInfo();
    expect(result).toBeDefined();
  });
});
*/
/*
describe("TwitterAPI.ts", () => {
  describe("mocked", () => {
    let testTwitterAPI: TwitterAPI;
    beforeEach(() => {
      testTwitterAPI = new TwitterAPI();
      testTwitterAPI["readAccessToken"] = jest
        .fn()
        .mockReturnValue("example-access-token");
    });
    it("hoge", () => {
      expect(testTwitterAPI["readAccessToken"]()).toBe("example-access-token");
    });
  });
  describe("reset Mock", () => {
    it("fuga", () => {
      const twitterAPI = new TwitterAPI();
      expect(twitterAPI["readAccessToken"]()).toBe(
        "WmdqbThJRGs5TzJiei03YjNxN1hXakZnODVJcjN3djB3VjVsYkRGVVM2UjQ5OjE2NTQwOTkzMDAxNzY6MToxOmF0OjE"
      );
    });
  });
});
*/
