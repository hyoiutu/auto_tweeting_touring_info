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
    this.accessToken = getEnv("STRAVA_API_ACCESS_TOKEN");
  }

  public static async build() {
    const stravaAPI = new StravaAPI();

    const isExpired = await stravaAPI.isExpiredAccessToken();
    if (isExpired) {
      await stravaAPI.refreshAccessToken();
    }

    return stravaAPI;
  }

  public async getMyProfile() {
    const res = await stravaAxios
      .get("/athlete", {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
      .catch((err) => {
        throw err;
      });
    return res.data;
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

  public async getActivities(
    fromJSON = true,
    beforeDate?: Date,
    afterDate?: Date
  ) {
    let activities: Array<any> = [];

    if (fromJSON && fs.existsSync("./json/latest_activities.json")) {
      activities = JSON.parse(
        readJSONFromFile("./json/latest_activities.json")
      ).filter((activity: any) => {
        return (
          (!afterDate || new Date(activity.start_date) >= afterDate) &&
          (!beforeDate || new Date(activity.start_date) <= beforeDate)
        );
      });
    }

    if (
      !fromJSON ||
      !fs.existsSync("./json/latest_activities.json") ||
      !activities.length
    ) {
      const dateParam = {
        before: beforeDate ? beforeDate.getTime() / 1000 : undefined,
        after: afterDate ? afterDate.getTime() / 1000 : undefined,
      };

      const res = await stravaAxios
        .get("/athlete/activities", {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          params: { ...dateParam },
        })
        .catch((err) => {
          throw err;
        });

      return res.data;
    }
  }

  private async isExpiredAccessToken() {
    return await this.getMyProfile()
      .then(() => {
        return false;
      })
      .catch((err) => {
        if (
          err.response.status === 401 &&
          err.response.data.errors.length > 0
        ) {
          const reason = err.response.data.errors[0];
          if (reason.field === "access_token" && reason.code === "invalid") {
            return true;
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
