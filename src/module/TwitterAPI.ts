import { twitterAxios } from "../axios";
import { getEnv } from "../util/env";

export class TwitterAPI {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string;
  constructor() {
    this.clientId = getEnv("TWITTER_API_CLIENT_ID");
    this.clientSecret = getEnv("TWITTER_API_CLIENT_SECRET");
    this.refreshToken = getEnv("TWITTER_API_REFRESH_TOKEN");
    this.accessToken = getEnv("TWITTER_API_ACCESS_TOKEN");
  }

  public static async build() {
    const twitterAPI = new TwitterAPI();

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

    this.accessToken = res.data.access_token as string;
    this.refreshToken = res.data.refresh_token as string;

    process.env["TWITTER_API_ACCESS_TOKEN"] = this.accessToken;
    process.env["TWITTER_API_REFRESH_TOKEN"] = this.refreshToken;

    console.log("Twitter API access token was refreshed");
  }
}
