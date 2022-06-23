import { GoogleMapStaticAPI } from "./module/GoogleMapStaticAPI";
import { StravaAPI } from "./module/StravaAPI";
import { writeAPIResToJSON, readJSONFromFile } from "./util/file";

import dotenv from "dotenv";
import { overWrittenSecretsEnvs, setSecretsEnvs } from "./util/env";
import { execSync } from "child_process";
import { OldTwitterAPI } from "./module/OldTwitterAPI";
import { TweetGenerator } from "./module/TweetGenerator";
async function main() {
  dotenv.config();
  setSecretsEnvs("./secrets");

  const stravaAPI = await StravaAPI.build();
  // const twitterAPI = await TwitterAPI.build();
  const twitterAPI = new OldTwitterAPI();
  const googleMapStaticAPI = GoogleMapStaticAPI.build();
  const tweetGenerator = new TweetGenerator(stravaAPI, googleMapStaticAPI, {
    svgOptions: {
      plotArea: "regions",
      margin: 10,
      width: 1600,
      height: 1600,
      fillColor: "#ffb6c1",
    },
  });

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

  const activities = await stravaAPI.getActivities(true, endDate, startDate);

  for (const activity of activities) {
    const tweetStatus = await tweetGenerator.generateTweetByActivityId(
      activity.id
    );

    const basicInfoResBody = JSON.parse(
      await twitterAPI.tweet(
        tweetStatus.basicInfo.tweet,
        tweetStatus.basicInfo.mediasFilePath
      )
    );
    let prevTweetId = basicInfoResBody.id_str;

    for (const citiesInfoTweet of tweetStatus.citiesInfo.tweets) {
      const resBody = JSON.parse(
        await twitterAPI.tweet(
          citiesInfoTweet,
          prevTweetId === basicInfoResBody.id_str
            ? tweetStatus.citiesInfo.mediasFilePath
            : undefined,
          prevTweetId
        )
      );

      prevTweetId = resBody.id_str;
    }
  }
  const days = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const summaryTweetStatus = await tweetGenerator.generateSummaryTweet(days);

  const summaryResBody = JSON.parse(
    await twitterAPI.tweet(summaryTweetStatus.basicInfo)
  );
  let prevTweetId = summaryResBody.id_str;

  for (const citiesInfoTweet of summaryTweetStatus.citiesInfo.tweets) {
    const resBody = JSON.parse(
      await twitterAPI.tweet(
        citiesInfoTweet,
        prevTweetId === summaryResBody.id_str
          ? summaryTweetStatus.citiesInfo.mediasFilePath
          : undefined,
        prevTweetId
      )
    );

    prevTweetId = resBody.id_str;
  }

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
