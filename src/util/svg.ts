import fs from "fs";
import { JSDOM } from "jsdom";
import { regionsToCodes, downloadTopoJSONs } from "./file";
import * as topojson from "topojson";
import { Feature, FeatureCollection, GeoJsonProperties, Point } from "geojson";
import { Topology } from "topojson-specification";
import * as d3 from "d3";

export function topoToGeo(topoJsonData: Topology) {
  return topojson.feature(topoJsonData, topoJsonData.objects.city) as
    | Feature<Point, GeoJsonProperties>
    | FeatureCollection<Point, GeoJsonProperties>;
}

export async function generateSVGByRegions(regions: string[]) {
  const codes = await regionsToCodes(regions);
  const downloadCodes = codes.filter(
    (code) => !fs.existsSync(`./topojson/${code}_city.i.topojson`)
  );
  await downloadTopoJSONs(downloadCodes);

  const document = new JSDOM().window.document;

  const topoJSONDataList = codes.map((code) => {
    return JSON.parse(
      fs.readFileSync(`./topojson/${code}_city.i.topojson`, "utf-8")
    ) as Topology;
  });

  const topoJSONDataLength = topoJSONDataList.length;
  console.log({ topoJSONDataLength });

  /*
  const translateLat =
    (topoJSONDataList
      .map((topoJSONData) => topoJSONData.transform?.translate[0])
      .reduce((x, y) => {
        console.log(`x + y = ${x} + ${y}`);
        return (x ?? 0) + (y ?? 0);
      }) ?? 0) / topoJSONDataLength;
  const translateLng =
    (topoJSONDataList
      .map((topoJSONData) => topoJSONData.transform?.translate[1])
      .reduce((x, y) => {
        console.log(`x + y = ${x} + ${y}`);
        return (x ?? 0) + (y ?? 0);
      }) ?? 0) / topoJSONDataLength;
      */
  const scaleLat =
    topoJSONDataList
      .map((topoJSONData) => topoJSONData.transform?.scale[0])
      .reduce((x, y) => (x ?? 0) + (y ?? 0)) ?? 0;
  const scaleLng =
    topoJSONDataList
      .map((topoJSONData) => topoJSONData.transform?.scale[1])
      .reduce((x, y) => (x ?? 0) + (y ?? 0)) ?? 0;
  Math.max(scaleLat, scaleLng);

  const minLat = Math.min(
    ...topoJSONDataList
      .map((topoJSONData) =>
        topoJSONData.bbox
          ? [topoJSONData.bbox[0], topoJSONData.bbox[2]]
          : Infinity
      )
      .flat()
  );
  const minLng = Math.min(
    ...topoJSONDataList
      .map((topoJSONData) =>
        topoJSONData.bbox
          ? [topoJSONData.bbox[1], topoJSONData.bbox[3]]
          : Infinity
      )
      .flat()
  );
  const maxLat = Math.max(
    ...topoJSONDataList
      .map((topoJSONData) =>
        topoJSONData.bbox
          ? [topoJSONData.bbox[0], topoJSONData.bbox[2]]
          : -Infinity
      )
      .flat()
  );
  const maxLng = Math.max(
    ...topoJSONDataList
      .map((topoJSONData) =>
        topoJSONData.bbox
          ? [topoJSONData.bbox[1], topoJSONData.bbox[3]]
          : -Infinity
      )
      .flat()
  );

  console.log({ maxLat, minLat, maxLng, minLng });

  const translateLat = (maxLat + minLat) / 2;
  const translateLng = (maxLng + minLng) / 2;

  const features = topoJSONDataList
    .map((topoJSONData) => {
      const geoJSONData = topoToGeo(topoJSONData);
      return geoJSONData.type === "FeatureCollection"
        ? geoJSONData.features
        : geoJSONData;
    })
    .flat();

  const width = 600;
  const height = 600;

  const centerLat = 142;
  const centerLng = 43;

  console.log({
    translateLat,
    translateLng,
  });

  const projection = d3
    .geoMercator()
    .center([translateLat, translateLng])
    .translate([width / 2, height / 2])
    .scale(1.1);
  const minPosition = projection([minLat, minLng]) ?? [0, 0];
  const maxPosition = projection([maxLat, maxLng]) ?? [0, 0];

  const originWidth = Math.abs(maxPosition[0] - minPosition[0]);
  const originHeight = Math.abs(maxPosition[1] - minPosition[1]);

  const scale = Math.min(width / originWidth, height / originHeight);

  console.log({
    minPosition,
    maxPosition,
    originWidth,
    originHeight,
    scale,
  });

  const aProjection = d3
    .geoMercator()
    .center([translateLat, translateLng])
    .translate([width / 2, height / 2])
    .scale(scale);
  const geoPath = d3.geoPath().projection(aProjection);
  const svg = d3
    .select(document.body)
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", Math.abs(width))
    .attr("height", Math.abs(height));

  svg
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("d", geoPath)
    .attr("class", (d) => {
      return d.id ? d.id : "unknown";
    })
    .style("stroke", "#000000")
    .style("stroke-width", 0.1)
    .style("fill", "#ffffff");

  for (const region of regions) {
    svg.select(`.${region}`).style("fill", "#5EAFC6");
  }

  fs.writeFileSync("test.svg", document.body.innerHTML);
}
