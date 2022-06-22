import { GoogleMapStaticAPI } from "../module/GoogleMapStaticAPI";
import { StravaAPI } from "../module/StravaAPI";
import { getCityByLatLng } from "../svg/latlng";
import polyline from "@mapbox/polyline";
import { generateSVGByRegions } from "../svg/svg";
import { svgToPng, writeAPIResToJSON } from "./file";
import { uniq, thinOut } from "./util";
import fs from "fs";
import { readJSONFromFile } from "./file";

export async function generateTweetByActivityId(
  stravaAPI: StravaAPI,
  googleMapStaticAPI: GoogleMapStaticAPI,
  activityId: string
) {
  const recordFile = "touringRecord/record.json";

  const { sumDistance: recordSumDistance, visitedCities: recordVisitedCities } =
    getTouringRecord(recordFile);

  const activity = await stravaAPI.getActivityDetailById(activityId);

  const fileName = `${activity.start_date_local}_${activity.name}`;
  const routeImg = `./routeImg/${fileName}.jpg`;
  await googleMapStaticAPI.getRouteMap(activity.map.summary_polyline, routeImg);

  const routeLatLngs = thinOut(
    polyline.decode(activity.map.summary_polyline),
    10
  );
  const cities = uniq(
    await Promise.all(
      routeLatLngs.map(async (latlng) => {
        return await getCityByLatLng({
          lat: latlng[0],
          lng: latlng[1],
        });
      })
    )
  );
  const visitedCities = recordVisitedCities.concat(cities);

  const svgPath = `./svg/${fileName}.svg`;
  const pngPath = `./png/${fileName}.png`;

  await generateSVGByRegions(cities, svgPath, {
    plotArea: "regions",
    margin: 10,
    width: 1600,
    height: 1600,
    fillColor: "#ffb6c1",
  });
  await svgToPng(svgPath, pngPath);

  const startCity = await getCityByLatLng({
    lat: activity.start_latlng[0],
    lng: activity.start_latlng[1],
  });
  const endCity = await getCityByLatLng({
    lat: activity.end_latlng[0],
    lng: activity.end_latlng[1],
  });

  const distanceKm = Math.round(activity.distance) / 1000;
  const sumDistance = recordSumDistance + distanceKm;

  const startEndCitiesText = `${startCity}~${endCity}`;
  const distanceKmText = `走行距離: ${distanceKm}km`;
  const sumDistanceText = `総距離: ${sumDistance}km`;
  const citiesText = `通過した市町村:\n${cities.join("\n")}`;

  const tweet = [
    startEndCitiesText,
    distanceKmText,
    sumDistanceText,
    "\n",
    citiesText,
  ].join("\n");

  writeAPIResToJSON(
    recordFile,
    JSON.stringify({
      sumDistance,
      visitedCities: uniq(visitedCities),
    })
  );

  return { tweet, mediasFilePath: [routeImg, pngPath] };
}

export async function generateSummaryTweet(days: number) {
  const recordFile = "touringRecord/record.json";

  const { sumDistance, visitedCities } = getTouringRecord(recordFile);

  const daysText = `総日数: ${days}日`;
  const sumDistanceText = `総距離: ${sumDistance}km`;
  const visitedCitiesText = `通過した市町村: \n${visitedCities.join("\n")}`;

  const tweet = [daysText, sumDistanceText, "\n", visitedCitiesText].join("\n");

  const svgPath = "./svg/summary.svg";
  const pngPath = "./png/summary.png";

  await generateSVGByRegions(visitedCities, svgPath, {
    plotArea: "regions",
    margin: 10,
    width: 1600,
    height: 1600,
    fillColor: "#ffb6c1",
  });
  await svgToPng(svgPath, pngPath);

  return { tweet, mediasFilePath: [pngPath] };
}

function getTouringRecord(recordPath: string) {
  let sumDistance = 0;
  let visitedCities: string[] = [];

  if (fs.existsSync(recordPath)) {
    const record = JSON.parse(readJSONFromFile(recordPath)) ?? {};
    sumDistance = record.sumDistance ?? 0;
    visitedCities = record.visitedCities ?? [];
  }

  return {
    sumDistance,
    visitedCities,
  };
}
