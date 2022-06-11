import { GoogleMapStaticAPI } from "./module/GoogleMapStaticAPI";
import { StravaAPI } from "./module/StravaAPI";
import { TwitterAPI } from "./module/TwitterAPI";
import { writeAPIResToJSON, readJSONFromFile } from "./util/file";
import { generateTweetByActivityId } from "./util/tweet";
import * as d3 from "d3";
import * as topojson from "topojson";
import fs from "fs";
import { JSDOM } from "jsdom";
import { Feature, Point, FeatureCollection, GeoJsonProperties } from "geojson";
import { generateSVGByRegions } from "./util/svg";
import { getCityByLatLng } from "./util/staravaData";
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

  const cities: string[] = [];

  for (const activity of activities) {
    const activityDetail = await stravaAPI.getActivityDetailById(activity.id);

    await googleMapStaticAPI.getRouteMap({
      polyline: activityDetail.map.summary_polyline,
      fileName: `${activityDetail.start_date_local}_${activityDetail.name}`,
    });

    cities.push(
      await getCityByLatLng({
        lat: activity.start_latlng[1],
        lng: activity.start_latlng[0],
      })
    );
    cities.push(
      await getCityByLatLng({
        lat: activity.end_latlng[1],
        lng: activity.end_latlng[0],
      })
    );
  }

  console.log({ cities });
  await generateSVGByRegions(cities, "./svg/hoge.svg");

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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
