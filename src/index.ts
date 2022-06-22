import { GoogleMapStaticAPI } from "./module/GoogleMapStaticAPI";
import { StravaAPI } from "./module/StravaAPI";
import { TwitterAPI } from "./module/TwitterAPI";
import { writeAPIResToJSON, readJSONFromFile, svgToPng } from "./util/file";
import { generateTweetByActivityId } from "./util/tweet";
import * as d3 from "d3";
import * as topojson from "topojson";
import fs from "fs";
import { JSDOM } from "jsdom";
import {
  Feature,
  Point,
  FeatureCollection,
  GeoJsonProperties,
  MultiPolygon,
  Geometry,
  GeometryObject,
  MultiPoint,
  LineString,
  MultiLineString,
  Polygon,
  GeometryCollection,
  Position,
  BBox,
} from "geojson";
import { generateSVGByRegions, readTopoJSON } from "./svg/svg";
import { getCityByLatLng } from "./svg/latlng";
import dotenv from "dotenv";
import { overWrittenSecretsEnvs, setSecretsEnvs } from "./util/env";
import { arrayBuffer } from "stream/consumers";
async function main() {
  dotenv.config();
  setSecretsEnvs("./secrets");

  // const stravaAPI = await StravaAPI.build();
  const twitterAPI = await TwitterAPI.build();
  // const googleMapStaticAPI = GoogleMapStaticAPI.build();
  /*
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

  const cities: string[] = [];

  for (const activity of activities) {
    const activityDetail = await stravaAPI.getActivityDetailById(activity.id);

    await googleMapStaticAPI.getRouteMap(
      activityDetail.map.summary_polyline,
      `./routeImg/${activityDetail.start_date_local}_${activityDetail.name}.jpg`
    );

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

  await generateSVGByRegions(cities, "./svg/hoge.svg", {
    plotArea: "regions",
    margin: 10,
  });
  await svgToPng("./svg/hoge.svg", "./png/margin.png");

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
  const randomString = [...Array(10)]
    .map(() => {
      return String.fromCharCode(Math.floor(Math.random() * (126 - 35)) + 35);
    })
    .join("");
  await twitterAPI.oldClientTweet(`ひょいうつ！${randomString}`, [
    "./png/margin.png",
    "routeImg/2021-12-31T08:59:32Z_Morning サイクリング.jpg",
  ]);
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
