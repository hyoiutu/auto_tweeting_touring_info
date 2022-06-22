import fs from "fs";
import { twitterAxios } from "../axios";
import { getEnv } from "../util/env";
import Twitter from "twitter";

export class TwitterAPI {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string;
  private isForTest: boolean;
  private oldClient: Twitter;
  constructor(isForTest = true) {
    if (isForTest) {
      this.clientId = getEnv("TEST_TWITTER_API_CLIENT_ID");
      this.clientSecret = getEnv("TEST_TWITTER_API_CLIENT_SECRET");
      this.refreshToken = getEnv("TEST_TWITTER_API_REFRESH_TOKEN");
      this.accessToken = getEnv("TEST_TWITTER_API_ACCESS_TOKEN");
      this.oldClient = new Twitter({
        consumer_key: getEnv("TEST_TWITTER_API_CONSUMER_KEY"),
        consumer_secret: getEnv("TEST_TWITTER_API_CONSUMER_SECRET"),
        access_token_key: getEnv("TEST_TWITTER_API_ACCESS_TOKEN_KEY"),
        access_token_secret: getEnv("TEST_TWITTER_API_ACCESS_TOKEN_SECRET"),
      });
    } else {
      this.clientId = getEnv("TWITTER_API_CLIENT_ID");
      this.clientSecret = getEnv("TWITTER_API_CLIENT_SECRET");
      this.refreshToken = getEnv("TWITTER_API_REFRESH_TOKEN");
      this.accessToken = getEnv("TWITTER_API_ACCESS_TOKEN");
      this.oldClient = new Twitter({
        consumer_key: getEnv("TWITTER_API_CONSUMER_KEY"),
        consumer_secret: getEnv("TWITTER_API_CONSUMER_SECRET"),
        access_token_key: getEnv("TWITTER_API_ACCESS_TOKEN_KEY"),
        access_token_secret: getEnv("TWITTER_API_ACCESS_TOKEN_SECRET"),
      });
    }

    this.isForTest = isForTest;
  }

  public static async build(isForTest = true) {
    const twitterAPI = new TwitterAPI(isForTest);

    const isExpired = await twitterAPI.isExpiredAccessToken();
    if (isExpired) {
      await twitterAPI.refreshAccessToken();
    }

    return twitterAPI;
  }

  public async getMyInfo() {
    const res = await twitterAxios
      .get("/users/me", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
      .then((res) => res)
      .catch((err) => {
        throw err;
      });

    return res.data.data;
  }

  public async tweet(text: string) {
    await twitterAxios.post(
      "/tweets",
      { text },
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      }
    );
    console.log("tweeted");
  }

  public async oldClientTweet(text: string, imagePaths?: string[]) {
    let options = {};
    if (imagePaths) {
      if (imagePaths.length > 4) {
        throw new Error("ツイートに載せられる画像は4つまでです。");
      }

      const mediaIds = await Promise.all(
        imagePaths.map(async (imagePath) => {
          return await this.uploadImageFromFile(imagePath);
        })
      );
      options = { media_ids: mediaIds.join(",") };
    }

    this.oldClient.post(
      "statuses/update",
      { status: text, ...options },
      (err, tweet, res) => {
        if (!err) {
          console.log(`tweet success: ${text}`);
        } else {
          console.error(err);
        }
      }
    );
  }

  public async uploadImageFromFile(path: string): Promise<string> {
    const image = fs.readFileSync(path);
    return new Promise((resolve, reject) => {
      this.oldClient.post(
        "media/upload",
        { media: image },
        (err, media, response) => {
          if (err) {
            reject(err);
          }
          resolve(media.media_id_string);
        }
      );
    });
  }

  private async isExpiredAccessToken() {
    return await this.getMyInfo()
      .then(() => false)
      .catch((err) => {
        if (
          err.response.data &&
          err.response.data.status === 401 &&
          err.response.data.title === "Unauthorized"
        ) {
          return true;
        }

        throw err;
      });
  }

  private async refreshAccessToken() {
    const res = await twitterAxios
      .post(
        "/oauth2/token",
        {
          client_id: this.clientId,
          grant_type: "refresh_token",
          refresh_token: this.refreshToken,
        },
        {
          auth: {
            username: this.clientId,
            password: this.clientSecret,
          },
        }
      )
      .then((res) => res)
      .catch((err) => {
        throw err;
      });

    this.accessToken = res.data.access_token.toString();
    this.refreshToken = res.data.refresh_token.toString();

    if (this.isForTest) {
      process.env["TEST_TWITTER_API_ACCESS_TOKEN"] = this.accessToken;
      process.env["TEST_TWITTER_API_REFRESH_TOKEN"] = this.refreshToken;
    } else {
      process.env["TWITTER_API_ACCESS_TOKEN"] = this.accessToken;
      process.env["TWITTER_API_REFRESH_TOKEN"] = this.refreshToken;
    }

    console.log("Twitter API access token was refreshed");
  }
}
