import { twitterAxios } from "../axios";
import fs from "fs";
import { CLIENT_ID, CLIENT_SECRET } from "../../constants/twitterAPI";

export class TwitterAPI {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string;
  constructor() {
    this.clientId = CLIENT_ID;
    this.clientSecret = CLIENT_SECRET;
    this.refreshToken = "";
    this.accessToken = "";
  }

  public static async build() {
    const twitterAPI = new TwitterAPI();
    twitterAPI.accessToken = twitterAPI.readAccessToken();
    twitterAPI.refreshToken = twitterAPI.readRefreshToken();

    const isExpired = await twitterAPI.isExpiredAccessToken();
    if (isExpired) {
      await twitterAPI.refreshAccessToken();

      twitterAPI.writeAccessToken(twitterAPI.accessToken);
      twitterAPI.writeRefreshToken(twitterAPI.refreshToken);
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

    console.log("Twitter API access token was refreshed");
  }

  private readAccessToken() {
    const accessToken = fs.readFileSync(
      "secrets/twitterAPIAccessToken",
      "utf-8"
    );
    return accessToken;
  }

  private readRefreshToken() {
    const refreshToken = fs.readFileSync(
      "secrets/twitterAPIRefreshToken",
      "utf-8"
    );
    return refreshToken;
  }

  private writeAccessToken(accessToken: string) {
    try {
      fs.writeFileSync("secrets/twitterAPIAccessToken", accessToken);
      console.log("write end");
    } catch (err) {
      console.error(err);
    }
  }

  private writeRefreshToken(refreshToken: string) {
    try {
      fs.writeFileSync("secrets/twitterAPIRefreshToken", refreshToken);
      console.log("write end");
    } catch (err) {
      console.error(err);
    }
  }
}
