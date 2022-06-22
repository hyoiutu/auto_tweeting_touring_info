import { GoogleMapStaticAPI } from "../module/GoogleMapStaticAPI";
import { StravaAPI } from "../module/StravaAPI";
import { getCityByLatLng } from "../svg/latlng";
import polyline from "@mapbox/polyline";
import { generateSVGByRegions } from "../svg/svg";
import { svgToPng } from "./file";

export async function generateTweetByActivityId(
  stravaAPI: StravaAPI,
  googleMapStaticAPI: GoogleMapStaticAPI,
  activityId: string,
  sumDistance: number
) {
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

  const distanceKm = Math.round(activity.distance) / 1000;

  const startCity = await getCityByLatLng({
    lat: activity.start_latlng[0],
    lng: activity.start_latlng[1],
  });
  const endCity = await getCityByLatLng({
    lat: activity.end_latlng[0],
    lng: activity.end_latlng[1],
  });

  const startEndCitiesText = `${startCity}~${endCity}`;
  const distanceKmText = `走行距離: ${distanceKm}km`;
  const sumDistanceText = `総距離: ${distanceKm + sumDistance}km`;
  const citiesText = `通過した市町村:\n${cities.join("\n")}`;

  const tweet = [
    startEndCitiesText,
    distanceKmText,
    sumDistanceText,
    citiesText,
  ].join("\n");

  const svgPath = `./svg/${fileName}.svg`;
  const pngPath = `./png/${fileName}.png`;

  await generateSVGByRegions(cities, svgPath, {
    plotArea: "regions",
    margin: 10,
    width: 1200,
    height: 1200,
  });
  await svgToPng(svgPath, pngPath);

  return { tweet, mediasFilePath: [routeImg, pngPath] };
}

function thinOut<T>(arr: Array<T>, thinOutRatio: number) {
  return arr.filter((_, i) => i % thinOutRatio === 0);
}

function uniq<T>(arr: Array<T>) {
  return [...new Set(arr)];
}
