import { GoogleMapStaticAPI } from "./module/GoogleMapStaticAPI";
import { StravaAPI } from "./module/StravaAPI";
import { TwitterAPI } from "./module/TwitterAPI";
import { writeAPIResToJSON, readJSONFromFile } from "./util/file";
import { generateTweetByActivityId } from "./util/tweet";

import dotenv from "dotenv";
import { overWrittenSecretsEnvs, setSecretsEnvs } from "./util/env";
async function main() {
  dotenv.config();
  setSecretsEnvs("./secrets");

  const stravaAPI = await StravaAPI.build();
  const twitterAPI = await TwitterAPI.build();
  const googleMapStaticAPI = GoogleMapStaticAPI.build();

  let activities;

  if (process.argv.length < 3 || process.argv[2] === "api") {
    activities = await stravaAPI.getActivities();
    writeAPIResToJSON(
      "./json/latest_activities.json",
      JSON.stringify(activities)
    );
  } else {
    activities = JSON.parse(readJSONFromFile("./json/latest_activities.json"));
  }

  const latestActivity = activities[0];

  const tweetStatus = await generateTweetByActivityId(
    stravaAPI,
    googleMapStaticAPI,
    latestActivity.id,
    0
  );

  await twitterAPI.oldClientTweet(
    tweetStatus.tweet,
    tweetStatus.mediasFilePath
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    // アクセストークンをリフレッシュして途中コケたときにアクセストークンが保存されていないとまずい
    // コメントアウトなどで実行されなくてもまずい
    overWrittenSecretsEnvs("./secrets");
  });
