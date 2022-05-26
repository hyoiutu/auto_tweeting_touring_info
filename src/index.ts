import { GoogleMapStaticAPI } from "./module/GoogleMapStaticAPI";
import { StravaAPI } from "./module/StravaAPI";
import { TwitterAPI } from "./module/TwitterAPI";
import { writeAPIResToJSON, readJSONFromFile } from "./util/file";
import { generateTweetByActivityId } from "./util/tweet";

async function main() {
  const stravaAPI = await StravaAPI.build();
  const twitterAPI = await TwitterAPI.build();
  const googleMapStaticAPI = GoogleMapStaticAPI.build();
  let activities;

  if (process.argv.length < 3 || process.argv[2] === "api") {
    activities = await stravaAPI.getActivities();
    writeAPIResToJSON({
      json: JSON.stringify(activities),
      path: "./json/latest_activities.json",
    });
  } else {
    activities = JSON.parse(readJSONFromFile("./json/latest_activities.json"));
  }
  /*
  const activityDetail = await stravaAPI.getActivityDetailById(
    activities[0].id
  );
  console.log(activityDetail.map);
}
*/
  /*
  let sumDistance = 0;
  for (const activity of activities) {
    const tweet = await generateTweetByActivityId(
      stravaAPI,
      activity.id,
      sumDistance
    );
    sumDistance += activity.distance / 1000;
    console.log("~~~~~~~~~~~~~~~~~");
    console.log(tweet);
    console.log("~~~~~~~~~~~~~~~~~");
  }
  */
  // MEMO: 本当にTweetを試したいときだけ使う
  // await twitterAPI.tweet("うっひょい！");

  googleMapStaticAPI.testAPI();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
