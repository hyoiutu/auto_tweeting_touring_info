import { twitterAxios } from "../axios";
import fs from "fs";
import {
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
} from "../../constants/twitterAPI";

export class TwitterAPI {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string;
  constructor() {
    this.clientId = CLIENT_ID;
    this.clientSecret = CLIENT_SECRET;
    this.refreshToken = REFRESH_TOKEN;
    this.accessToken = "";
  }

  public static async build() {
    const twitterAPI = new TwitterAPI();
    const accessToken = await twitterAPI.readAccessToken();
    // TODO: accessTokenが失効してそうであればこの辺の実装を進める
    /*
    const isExpired = await twitterAPI.isExpiredAccessToken(accessToken);
    if (isExpired) {
      await twitterAPI.refreshAccessToken();
      await twitterAPI.writeAccessToken(twitterAPI.accessToken);
    } else {
      twitterAPI.accessToken = accessToken;
    }
    */
    twitterAPI.accessToken = accessToken;

    return twitterAPI;
  }

  public async getMyInfo() {
    const res = await twitterAxios.get("/users/me", {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
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

  /*
  private async isExpiredAccessToken(accessToken: string) {
    return await instance
      .get("/athlete", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
      .then(() => {
        return false;
      })
      .catch((err) => {
        if (err.response.status === 401) {
          if (err.response.data.errors.length > 0) {
            const reason = err.response.data.errors[0];
            if (reason.field === "access_token" && reason.code === "invalid") {
              return true;
            }
          }
        }
        throw err;
      });
  }

  private async refreshAccessToken() {
    const res = await instance.post(`/oauth/token?client_id=${this.clientId}`, {
      client_secret: this.clientSecret,
      grant_type: "refresh_token",
      refresh_token: this.refreshToken,
    });

    this.accessToken = res.data.access_token as string;
  }
  */

  private async readAccessToken() {
    const accessToken = fs.readFileSync(
      "secrets/twitterAPIAccessToken",
      "utf-8"
    );
    return accessToken;
  }
  /*
  private async writeAccessToken(accessToken: string) {
    try {
      fs.writeFileSync("secrets/twitterAPIAccessToken", accessToken);
      console.log("write end");
    } catch (err) {
      console.error(err);
    }
  }
  */
}
