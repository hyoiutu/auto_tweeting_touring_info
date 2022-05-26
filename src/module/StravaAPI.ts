import { stravaAxios } from "../axios";
import fs from "fs";
import {
  CLIENT_ID,
  CLIENT_SECRET,
  REFRESH_TOKEN,
} from "../../constants/stravaAPI";

export class StravaAPI {
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
    const stravaAPI = new StravaAPI();
    const accessToken = await stravaAPI.readAccessToken();

    const isExpired = await stravaAPI.isExpiredAccessToken(accessToken);
    if (isExpired) {
      await stravaAPI.refreshAccessToken();
      await stravaAPI.writeAccessToken(stravaAPI.accessToken);
    } else {
      stravaAPI.accessToken = accessToken;
    }

    return stravaAPI;
  }

  public async getActivityDetailById(activityId: string) {
    const res = await stravaAxios
      .get(`/activities/${activityId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
      .catch((err) => {
        throw err;
      });

    return res.data;
  }

  public async getActivities() {
    const res = await stravaAxios
      .get("/athlete/activities", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
      .catch((err) => {
        throw err;
      });

    return res.data;
  }

  private async isExpiredAccessToken(accessToken: string) {
    return await stravaAxios
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
    const res = await stravaAxios.post(
      `/oauth/token?client_id=${this.clientId}`,
      {
        client_secret: this.clientSecret,
        grant_type: "refresh_token",
        refresh_token: this.refreshToken,
      }
    );

    this.accessToken = res.data.access_token as string;
  }

  private async readAccessToken() {
    const accessToken = fs.readFileSync(
      "secrets/stravaAPIAccessToken",
      "utf-8"
    );
    return accessToken;
  }

  private async writeAccessToken(accessToken: string) {
    try {
      fs.writeFileSync("secrets/stravaAPIAccessToken", accessToken);
      console.log("write end");
    } catch (err) {
      console.error(err);
    }
  }
}
