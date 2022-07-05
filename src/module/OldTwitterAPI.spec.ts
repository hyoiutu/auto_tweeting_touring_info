import fs from "fs";
import Twitter from "twitter";
import { getEnv } from "../util/env";
import { OldTwitterAPI } from "./OldTwitterAPI";

// 実際にAPIを叩かないように封じる
jest.mock("twitter");

describe("OldTwitterAPI.ts", () => {
  describe("constructor", () => {
    describe("forTestの場合", () => {
      it("テスト用のコンシューマーキーなどがセットされる", () => {
        new OldTwitterAPI(true);
        expect(Twitter).toBeCalledWith({
          consumer_key: getEnv("TEST_TWITTER_API_CONSUMER_KEY"),
          consumer_secret: getEnv("TEST_TWITTER_API_CONSUMER_SECRET"),
          access_token_key: getEnv("TEST_TWITTER_API_ACCESS_TOKEN_KEY"),
          access_token_secret: getEnv("TEST_TWITTER_API_ACCESS_TOKEN_SECRET"),
        });
      });
    });
    describe("forTestではない場合", () => {
      it("本番用のコンシューマーキーなどがセットされる", () => {
        new OldTwitterAPI(false);
        expect(Twitter).toBeCalledWith({
          consumer_key: getEnv("TWITTER_API_CONSUMER_KEY"),
          consumer_secret: getEnv("TWITTER_API_CONSUMER_SECRET"),
          access_token_key: getEnv("TWITTER_API_ACCESS_TOKEN_KEY"),
          access_token_secret: getEnv("TWITTER_API_ACCESS_TOKEN_SECRET"),
        });
      });
    });
  });
  describe("tweet", () => {
    let twitterAPI: OldTwitterAPI;
    let mockTweet: jest.SpyInstance;
    new Twitter({
      consumer_key: getEnv("TWITTER_API_CONSUMER_KEY"),
      consumer_secret: getEnv("TWITTER_API_CONSUMER_SECRET"),
      access_token_key: getEnv("TWITTER_API_ACCESS_TOKEN_KEY"),
      access_token_secret: getEnv("TWITTER_API_ACCESS_TOKEN_SECRET"),
    });
    beforeEach(() => {
      twitterAPI = new OldTwitterAPI(true);
    });
    describe("ツイートに4つ以上の画像を載せようとした場合", () => {
      it("例外が投げられる", async () => {
        await expect(
          twitterAPI.tweet("hoge", [
            "examplePath",
            "examplePath",
            "examplePath",
            "examplePath",
            "examplePath",
          ])
        ).rejects.toThrow("ツイートに載せられる画像は4つまでです。");
      });
    });
    describe("140文字を超えてツイートしようとした場合", () => {
      let tweetText = "";
      const overtText = "bbb";
      beforeEach(() => {
        tweetText = tweetText.padStart(140, "a") + overtText;
        jest
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .spyOn(twitterAPI as any, "_tweet")
          // eslint-disable-next-line prettier/prettier
          .mockResolvedValue("{ \"id_str\": \"example-id_str\" }");
        mockTweet = jest.spyOn(twitterAPI, "tweet");
      });
      it("140文字よりも後の文字列はリプライで繋げられる", async () => {
        await twitterAPI.tweet(tweetText);

        expect.assertions(3);

        expect(mockTweet).toBeCalledTimes(2);
        expect(mockTweet).toBeCalledWith(tweetText);
        expect(mockTweet).toBeCalledWith("bbb", undefined, "example-id_str");
      });
    });
  });
  describe("uploadImageFromFile", () => {
    let twitterAPI: OldTwitterAPI;

    beforeEach(() => {
      fs.writeFileSync(
        `${getEnv("TEST_FILES_DIR")}/exampleMedia`,
        "example-media"
      );
      twitterAPI = new OldTwitterAPI(true);

      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(twitterAPI as any, "_uploadImageFromFile")
        // eslint-disable-next-line prettier/prettier
        .mockResolvedValue("example-media-id");
    });
    it("アップロードした画像のIDが返ってくる", async () => {
      const result = await twitterAPI.uploadImageFromFile(
        `${getEnv("TEST_FILES_DIR")}/exampleMedia`
      );
      expect(result).toBe("example-media-id");
    });
  });
});
