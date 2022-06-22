import { GoogleMapStaticAPI } from "./module/GoogleMapStaticAPI";
import { StravaAPI } from "./module/StravaAPI";
import { TwitterAPI } from "./module/TwitterAPI";
import { writeAPIResToJSON, readJSONFromFile } from "./util/file";
import { generateSummaryTweet, generateTweetByActivityId } from "./util/tweet";

import dotenv from "dotenv";
import { overWrittenSecretsEnvs, setSecretsEnvs } from "./util/env";
import { execSync } from "child_process";
async function main() {
  dotenv.config();
  setSecretsEnvs("./secrets");

  const stravaAPI = await StravaAPI.build();
  const twitterAPI = await TwitterAPI.build();
  const googleMapStaticAPI = GoogleMapStaticAPI.build();

  // let activities;

  /*
  if (process.argv.length < 3 || process.argv[2] === "api") {
    activities = await stravaAPI.getActivities();
    writeAPIResToJSON(
      "./json/latest_activities.json",
      JSON.stringify(activities)
    );
  } else {
    activities = JSON.parse(readJSONFromFile("./json/latest_activities.json"));
  }*/
  if (process.argv.length < 4) {
    throw new Error("引数は2つ以上入力してください");
  }

  const startDate = new Date(process.argv[2]);
  const endDate = new Date(process.argv[3]);

  const activities = JSON.parse(
    readJSONFromFile("./json/latest_activities.json")
  );

  const filteringActivities = activities.filter((activity: any) => {
    return (
      new Date(activity.start_date) >= startDate &&
      new Date(activity.start_date) <= endDate
    );
  });

  for (const activity of filteringActivities) {
    console.log(`${activity.start_date}`);
  }

  for (const activity of filteringActivities) {
    const tweetStatus = await generateTweetByActivityId(
      stravaAPI,
      googleMapStaticAPI,
      activity.id
    );

    await twitterAPI.oldClientTweet(
      tweetStatus.tweet,
      tweetStatus.mediasFilePath
    );
  }
  const days = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const summaryTweetStatus = await generateSummaryTweet(days);

  await twitterAPI.oldClientTweet(
    summaryTweetStatus.tweet,
    summaryTweetStatus.mediasFilePath
  );

  execSync("rm ./touringRecord/record.json");
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
