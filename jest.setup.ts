import dotenv from "dotenv";
import { existsSync } from "fs";
import { execSync } from "child_process";
import { getEnv } from "./src/util/env";

export default () => {
  dotenv.config();

  process.env = {
    ...process.env,
    STRAVA_API_ACCESS_TOKEN: "example-access-token",
    TWITTER_API_ACCESS_TOKEN: "example-access-token",
    TWITTER_API_REFRESH_TOKEN: "example-refresh-token",
    TEST_FILES_DIR: "./testFiles",
  };

  const testDir = getEnv("TEST_FILES_DIR");

  if (!existsSync(testDir)) {
    execSync(`mkdir ${testDir}`);
  } else {
    execSync(`rm -rf ${testDir}`);
    execSync(`mkdir ${testDir}`);
  }
};
