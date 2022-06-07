import fs from "fs";
import { JSDOM } from "jsdom";
import { regionsToCodes, downloadTopoJSONs } from "./file";
import * as topojson from "topojson";
import {
  BBox,
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Point,
} from "geojson";
import { Topology } from "topojson-specification";
import * as d3 from "d3";
import { getMidLatLng, getMaxBboxByBboxList } from "./latlng";

export function topoToGeo(topoJsonData: Topology) {
  return topojson.feature(topoJsonData, topoJsonData.objects.city) as
    | Feature<Point, GeoJsonProperties>
    | FeatureCollection<Point, GeoJsonProperties>;
}

export async function generateSVGByRegions(regions: string[]) {
  const codes = await regionsToCodes(regions);

  await downloadTopoJSONs(codes);

  const document = new JSDOM().window.document;

  const topoJSONDataList = codes.map((code) => {
    return JSON.parse(
      fs.readFileSync(`./topojson/${code}_city.i.topojson`, "utf-8")
    ) as Topology;
  });
  const bboxList = topoJSONDataList
    .map((topoJSONData) => topoJSONData.bbox)
    .filter((v): v is Exclude<typeof v, undefined> => v !== undefined);
  const [minLng, minLat, maxLng, maxLat] = getMaxBboxByBboxList(bboxList);

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

  const { midLat, midLng } = getMidLatLng(
    { lat: maxLat, lng: maxLng },
    { lat: minLat, lng: minLng }
  );

  const scale = getScaleByBbox([minLng, minLat, maxLng, maxLat], width, height);

  const aProjection = d3
    .geoMercator()
    .center([midLng, midLat])
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

function getScaleByBbox(bbox: BBox, width: number, height: number) {
  const projection = d3
    .geoMercator()
    .translate([width / 2, height / 2])
    .scale(1);

  const minPosition = projection([bbox[0], bbox[1]]) ?? [0, 0];
  const maxPosition = projection([bbox[2], bbox[3]]) ?? [0, 0];

  const originWidth = Math.abs(maxPosition[0] - minPosition[0]);
  const originHeight = Math.abs(maxPosition[1] - minPosition[1]);

  return Math.min(width / originWidth, height / originHeight);
}
