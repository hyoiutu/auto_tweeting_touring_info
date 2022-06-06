// import { GoogleMapStaticAPI } from "./module/GoogleMapStaticAPI";
// import { StravaAPI } from "./module/StravaAPI";
// import { TwitterAPI } from "./module/TwitterAPI";
// import { writeAPIResToJSON, readJSONFromFile } from "./util/file";
//import { generateTweetByActivityId } from "./util/tweet";
import * as d3 from "d3";
import * as topojson from "topojson";
import fs from "fs";
import { JSDOM } from "jsdom";
import { Feature, Point, FeatureCollection, GeoJsonProperties } from "geojson";

async function main() {
  /*
  const stravaAPI = await StravaAPI.build();
  const twitterAPI = await TwitterAPI.build();
  const googleMapStaticAPI = GoogleMapStaticAPI.build();
  let activities;
  */

  const document = new JSDOM().window.document;

  const topoHokkaido = JSON.parse(
    fs.readFileSync("./01_city.i.topojson", "utf-8")
  );

  const geoHokkaido = topojson.feature(
    topoHokkaido,
    topoHokkaido.objects.city
  ) as
    | Feature<Point, GeoJsonProperties>
    | FeatureCollection<Point, GeoJsonProperties>;
  if (geoHokkaido.type === "FeatureCollection") {
    geoHokkaido as FeatureCollection<Point, GeoJsonProperties>;
  } else {
    geoHokkaido as Feature<Point, GeoJsonProperties>;
    return;
  }

  const width = 600,
    height = 600;
  const scale = 4800;

  const aProjection = d3
    .geoMercator()
    .center([142.2, 43.4])
    .translate([width / 2, height / 2])
    .scale(scale);
  const geoPath = d3.geoPath().projection(aProjection);
  const svg = d3
    .select(document.body)
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", width)
    .attr("height", height);

  svg
    .selectAll("path")
    .data(geoHokkaido.features)
    .enter()
    .append("path")
    .attr("d", geoPath)
    .attr("class", (d) => {
      return d.id ? d.id : "unknown";
    })
    .style("stroke", "#000000")
    .style("stroke-width", 0.1)
    .style("fill", "#ffffff");

  const examples = ["北海道札幌市中央区", "北海道積丹郡積丹町", "北海道北見市"];
  for (const example of examples) {
    svg.select(`.${example}`).style("fill", "#5EAFC6");
  }

  fs.writeFileSync("test.svg", document.body.innerHTML);

  /*
  if (process.argv.length < 3 || process.argv[2] === "api") {
    activities = await stravaAPI.getActivities();
    writeAPIResToJSON({
      json: JSON.stringify(activities),
      path: "./json/latest_activities.json",
    });
  } else {
    activities = JSON.parse(readJSONFromFile("./json/latest_activities.json"));
  }
  */
  /*
  const activityDetail = await stravaAPI.getActivityDetailById(
    activities[0].id
  );

  await googleMapStaticAPI.getRouteMap({
    polyline: activityDetail.map.summary_polyline,
    fileName: `${activityDetail.start_date_local}_${activityDetail.name}`,
  });
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
