import { generateSVGByRegions, GenerateSVGByRegionsOptions } from "../svg/svg";
import fs from "fs";
import { readJSONFromFile, svgToPng, writeAPIResToJSON } from "../util/file";
import { StravaAPI } from "./StravaAPI";
import { GoogleMapStaticAPI } from "./GoogleMapStaticAPI";
import { thinOut, uniq } from "../util/util";
import { getCityByLatLng } from "../svg/latlng";
import polyline from "@mapbox/polyline";

type ImageSettingsOptions = {
  svgOptions: GenerateSVGByRegionsOptions;
};

const defaultImageSettings: ImageSettingsOptions = {
  svgOptions: {
    plotArea: "regions",
    width: 600,
    height: 600,
    fillColor: "#5EAFC6",
    margin: 0,
  },
};

export class TweetGenerator {
  private imageSettings: ImageSettingsOptions;
  private sumDistance: number;
  private visitedCities: string[];
  private stravaAPI: StravaAPI;
  private googleMapStaticAPI: GoogleMapStaticAPI;

  constructor(
    stravaAPI: StravaAPI,
    googleMapStaticAPI: GoogleMapStaticAPI,
    imageSettings: Partial<ImageSettingsOptions> = {}
  ) {
    this.imageSettings = { ...defaultImageSettings, ...imageSettings };
    const { sumDistance, visitedCities } = this.getTouringRecord(
      "./touringRecord/record.json"
    );
    this.sumDistance = sumDistance;
    this.visitedCities = visitedCities;

    this.stravaAPI = stravaAPI;
    this.googleMapStaticAPI = googleMapStaticAPI;
  }

  private getTouringRecord(recordPath: string) {
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

  public async generateTweetByActivityId(activityId: string) {
    const recordFile = "touringRecord/record.json";

    const activity = await this.stravaAPI.getActivityDetailById(activityId);

    const fileName = `${activity.start_date_local}_${activity.name}`;
    const routeImg = `./routeImg/${fileName}.jpg`;
    await this.googleMapStaticAPI.getRouteMap(
      activity.map.summary_polyline,
      routeImg
    );

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

    this.visitedCities = uniq(this.visitedCities.concat(cities));

    const svgPath = `./svg/${fileName}.svg`;
    const pngPath = `./png/${fileName}.png`;

    await generateSVGByRegions(cities, svgPath, this.imageSettings.svgOptions);
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
    this.sumDistance =
      Math.round((this.sumDistance + distanceKm) * 1000) / 1000;

    const startEndCitiesText = `${startCity}~${endCity}`;
    const distanceKmText = `走行距離: ${distanceKm}km`;
    const sumDistanceText = `総距離: ${this.sumDistance}km`;
    const citiesText = `通過した市町村:\n${cities.join("\n")}`;

    const basicInfo = {
      tweet: [startEndCitiesText, distanceKmText, sumDistanceText, "\n"].join(
        "\n"
      ),
      mediasFilePath: [routeImg],
    };

    const citiesInfosTweets = [];
    let nextTweet = citiesText;
    while (nextTweet.length > 140) {
      const indexCandidate = nextTweet.substring(0, 140).lastIndexOf("\n");
      const lastCityIndex = indexCandidate === -1 ? 140 : indexCandidate;
      const oneTweet = nextTweet.substring(0, lastCityIndex);
      citiesInfosTweets.push(oneTweet);

      nextTweet = nextTweet.substring(lastCityIndex + 1);
      console.log({ lastCityIndex, nextTweetLength: nextTweet.length });
    }
    citiesInfosTweets.push(nextTweet);

    const citiesInfo = { tweets: citiesInfosTweets, mediasFilePath: [pngPath] };

    writeAPIResToJSON(
      recordFile,
      JSON.stringify({
        sumDistance: this.sumDistance,
        visitedCities: this.visitedCities,
      })
    );

    return { basicInfo, citiesInfo };
  }

  public async generateSummaryTweet(days: number) {
    const daysText = `総日数: ${days}日`;
    const sumDistanceText = `総距離: ${this.sumDistance}km`;
    const visitedCitiesText = `通過した市町村: \n${this.visitedCities.join(
      "\n"
    )}`;

    const basicInfo = [daysText, sumDistanceText].join("\n");

    const svgPath = "./svg/summary.svg";
    const pngPath = "./png/summary.png";

    await generateSVGByRegions(
      this.visitedCities,
      svgPath,
      this.imageSettings.svgOptions
    );
    await svgToPng(svgPath, pngPath);

    const citiesInfosTweets = [];
    let nextTweet = visitedCitiesText;
    while (nextTweet.length > 140) {
      const indexCandidate = nextTweet.substring(0, 140).lastIndexOf("\n");
      const lastCityIndex = indexCandidate === -1 ? 140 : indexCandidate;
      const oneTweet = nextTweet.substring(0, lastCityIndex);
      citiesInfosTweets.push(oneTweet);

      nextTweet = nextTweet.substring(lastCityIndex + 1);
      console.log({ lastCityIndex, nextTweetLength: nextTweet.length });
    }
    citiesInfosTweets.push(nextTweet);

    const citiesInfo = { tweets: citiesInfosTweets, mediasFilePath: [pngPath] };

    return { basicInfo, citiesInfo, mediasFilePath: [pngPath] };
  }
}
