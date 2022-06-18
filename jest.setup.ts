import dotenv from "dotenv";

export default () => {
  dotenv.config();

  process.env = {
    ...process.env,
    STRAVA_API_ACCESS_TOKEN: "example-access-token",
    TWITTER_API_ACCESS_TOKEN: "example-access-token",
    TWITTER_API_REFRESH_TOKEN: "example-refresh-token",
  };
};
