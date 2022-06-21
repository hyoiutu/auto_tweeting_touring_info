import axios from "axios";
import * as AxiosLogger from "axios-logger";

export const stravaAxios = axios.create({
  baseURL: "https://www.strava.com/api/v3/",
});

export const twitterAxios = axios.create({
  baseURL: "https://api.twitter.com/2/",
});

stravaAxios.interceptors.request.use((req) => {
  return AxiosLogger.requestLogger(req, { dateFormat: "yyyy-mm-dd HH:MM:ss" });
});

stravaAxios.interceptors.response.use((res) => {
  return AxiosLogger.responseLogger(res, { dateFormat: "yyyy-mm-dd HH:MM:ss" });
});

twitterAxios.interceptors.request.use((req) => {
  return AxiosLogger.requestLogger(req, { dateFormat: "yyyy-mm-dd HH:MM:ss" });
});

twitterAxios.interceptors.response.use((res) => {
  return AxiosLogger.responseLogger(res, { dateFormat: "yyyy-mm-dd HH:MM:ss" });
});
