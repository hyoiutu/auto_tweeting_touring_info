import { stravaAxios } from "../axios";
import fs from "fs";
import { readJSONFromFile, writeAPIResToJSON } from "../util/file";
import { getEnv } from "../util/env";

export class StravaAPI {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string;
  constructor() {
    this.clientId = getEnv("STRAVA_API_CLIENT_ID");
    this.clientSecret = getEnv("STRAVA_API_CLIENT_SECRET");
    this.refreshToken = getEnv("STRAVA_API_REFRESH_TOKEN");
    this.accessToken = "";
  }

  public static async build() {
    const stravaAPI = new StravaAPI();
    const accessToken = getEnv("STRAVA_API_ACCESS_TOKEN");

    const isExpired = await stravaAPI.isExpiredAccessToken(accessToken);
    if (isExpired) {
      await stravaAPI.refreshAccessToken();
    } else {
      stravaAPI.accessToken = accessToken;
    }

    return stravaAPI;
  }

  public async getActivityDetailById(activityId: string) {
    if (!fs.existsSync(`./json/${activityId}.json`)) {
      const res = await stravaAxios
        .get(`/activities/${activityId}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        })
        .catch((err) => {
          throw err;
        });

      writeAPIResToJSON(`./json/${activityId}.json`, JSON.stringify(res.data));

      return res.data;
    } else {
      return JSON.parse(readJSONFromFile(`./json/${activityId}.json`));
    }
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

    this.accessToken = res.data.access_token.toString();

    process.env.STRAVA_API_ACCESS_TOKEN = this.accessToken;

    console.log("Strava API access token was refreshed");
  }
}
