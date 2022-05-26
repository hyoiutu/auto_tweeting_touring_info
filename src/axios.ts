import axios from "axios";

export const stravaAxios = axios.create({
  baseURL: "https://www.strava.com/api/v3/",
});

export const twitterAxios = axios.create({
  baseURL: "https://api.twitter.com/2/",
});
