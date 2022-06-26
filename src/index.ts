import { GoogleMapStaticAPI } from "./module/GoogleMapStaticAPI";
import { StravaAPI } from "./module/StravaAPI";
import { writeAPIResToJSON, readJSONFromFile } from "./util/file";

import dotenv from "dotenv";
import { overWrittenSecretsEnvs, setSecretsEnvs } from "./util/env";
import { execSync } from "child_process";
import { OldTwitterAPI } from "./module/OldTwitterAPI";
import { TweetContentGenerator } from "./module/TweetContentGenerator";
import { Tweet } from "./module/Tweet";
import { days } from "./util/util";
async function main() {
  dotenv.config();
  setSecretsEnvs("./secrets");

  const stravaAPI = await StravaAPI.build();
  // const twitterAPI = await TwitterAPI.build();
  const twitterAPI = new OldTwitterAPI();
  const googleMapStaticAPI = GoogleMapStaticAPI.build();
  const tweetGenerator = new TweetContentGenerator(
    stravaAPI,
    googleMapStaticAPI,
    {
      svgOptions: {
        plotArea: "regions",
        margin: 10,
        width: 1600,
        height: 1600,
        fillColor: "#ffb6c1",
      },
    }
  );
  const tweet = new Tweet(twitterAPI);

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

  const afterDate = new Date(process.argv[2]);
  const beforeDate = new Date(process.argv[3]);

  if (afterDate >= beforeDate) {
    throw new Error("第1引数の日時は第2引数の日時より前にしてください");
  }

  const activities = await stravaAPI.getActivities(true, beforeDate, afterDate);

  for (const activity of activities) {
    const tweetStatus = await tweetGenerator.generateTweetByActivityId(
      activity.id
    );
    tweet.chainTweet(tweetStatus);
  }
  const touringDays = days(afterDate, beforeDate);
  const summaryTweetStatus = await tweetGenerator.generateSummaryTweet(
    touringDays
  );

  tweet.chainTweet(summaryTweetStatus);

  execSync("rm ./touringRecord/record.json");

  /*
  const randomString = [...Array(700)]
    .map(() => {
      return String.fromCharCode(Math.floor(Math.random() * (126 - 35)) + 35);
    })
    .join("");

  await twitterAPI.oldClientTweet(randomString);
  */
}

main()
  .catch((err) => {
    overWrittenSecretsEnvs("./secrets");
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    // アクセストークンをリフレッシュして途中コケたときにアクセストークンが保存されていないとまずい
    // コメントアウトなどで実行されなくてもまずい
    overWrittenSecretsEnvs("./secrets");
  });
