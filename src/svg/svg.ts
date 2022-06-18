import fs from "fs";
import { JSDOM } from "jsdom";
import { regionsToCodes, downloadTopoJSONs } from "../util/file";
import * as topojson from "topojson";
import * as svg from "./svg";
import * as bbox from "./bbox";
import {
  BBox,
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  Point,
  Position,
} from "geojson";
import { Topology } from "topojson-specification";
import * as d3 from "d3";
import * as latlng from "./latlng";
import { ValueFn } from "d3";
import { eachSlice } from "../util/util";

type PlotArea = "prefecture" | "regions";

type GenerateSVGByRegionsOptions = {
  plotArea: PlotArea;
};

export function topoToGeo(
  topoJsonData: Topology,
  geometry: unknown
):
  | Feature<Point, GeoJsonProperties>
  | FeatureCollection<Point, GeoJsonProperties> {
  if (!("type" in (geometry as Geometry))) {
    throw new Error("typeがありません");
  }
  // GeometryObjectが勝手にGeometryに解釈してfeatureに渡して型エラー起こしている
  // 仕方ないのでanyにして渡す
  // 定義元を見るとexport type GeometryObject = Geometryしている
  return topojson.feature(topoJsonData, geometry as any);
}

export function readTopoJSON(path: string) {
  return JSON.parse(fs.readFileSync(path, "utf-8")) as Topology;
}

export function getFeaturesByGeoJSONList(
  geoJsonDataList: (
    | Feature<Point, GeoJsonProperties>
    | FeatureCollection<Point, GeoJsonProperties>
  )[]
) {
  return geoJsonDataList
    .map((geoJsonData) => {
      return geoJsonData.type === "FeatureCollection"
        ? geoJsonData.features
        : geoJsonData;
    })
    .flat();
}

export async function generateSVGByRegions(
  regions: string[],
  filePath: string,
  options = { plotArea: "regions" } as GenerateSVGByRegionsOptions
) {
  const codes = await regionsToCodes(regions);

  await downloadTopoJSONs(codes);

  const topoJSONDataList = codes.map((code) => {
    return readTopoJSON(`./topojson/${code}_city.i.topojson`);
  });
  const geoJsonDataList = topoJSONDataList.map((topoJSONData) =>
    topoToGeo(topoJSONData, topoJSONData.objects.city)
  );
  const features = getFeaturesByGeoJSONList(geoJsonDataList);

  let [minLng, minLat, maxLng, maxLat] = [0, 0, 0, 0];

  if (options.plotArea === "prefecture") {
    const bboxList = topoJSONDataList
      .map((topoJSONData) => topoJSONData.bbox)
      .filter((v): v is Exclude<typeof v, undefined> => v !== undefined);
    [minLng, minLat, maxLng, maxLat] = bbox.getMaxBboxByBboxList(bboxList);
  } else {
    const targetFeatures = getFeaturesByRegions(regions, features);
    [minLng, minLat, maxLng, maxLat] =
      bbox.getMaxBboxByFeatures(targetFeatures);
  }

  const width = 600;
  const height = 600;

  const { midLat, midLng } = latlng.getMidLatLng(
    { lat: maxLat, lng: maxLng },
    { lat: minLat, lng: minLng }
  );

  const { d3Svg, document } = getSVGByBbox(
    [minLng, minLat, maxLng, maxLat],
    features,
    width,
    height,
    {
      lat: midLat,
      lng: midLng,
    },
    (d) => {
      return typeof d.id === "string"
        ? d.id.replace(/(^京都府)|(.+?[都道府県])(.*支庁)(.*)/, "$2$4")
        : "unknown";
    }
  );

  for (const region of regions) {
    d3Svg.select(`.${region}`).style("fill", "#5EAFC6");
  }

  fs.writeFileSync(filePath, document.body.innerHTML);
}

export function getSVGByBbox(
  bbox: BBox,
  features: Feature<Point, GeoJsonProperties>[],
  width: number,
  height: number,
  center: { lat: number; lng: number },
  classFn: ValueFn<
    SVGPathElement,
    Feature<Point, GeoJsonProperties>,
    string | number | boolean | null
  >
) {
  const document = new JSDOM().window.document;

  const scale = getScaleByBbox(bbox, width, height);

  const aProjection = d3
    .geoMercator()
    .center([center.lng, center.lat])
    .translate([width / 2, height / 2])
    .scale(scale);
  const geoPath = d3.geoPath().projection(aProjection);
  const d3Svg = d3
    .select(document.body)
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", Math.abs(width))
    .attr("height", Math.abs(height));

  d3Svg
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("d", geoPath)
    .attr("class", classFn)
    .style("stroke", "#000000")
    .style("stroke-width", 0.1)
    .style("fill", "#ffffff");

  return { d3Svg, document };
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

export function geometryToPositions(geometry: Geometry): Position[] {
  if (geometry.type !== "GeometryCollection") {
    const flattenCoodinates = geometry.coordinates.flat().flat().flat();
    return eachSlice(flattenCoodinates, 2) as Position[];
  }
  return geometry.geometries
    .map((g) => {
      return svg.geometryToPositions(g);
    })
    .flat();
}

export function getFeaturesByRegions(regions: string[], features: Feature[]) {
  return features.filter((feature) => {
    return feature.id && regions.includes(feature.id.toString());
  });
}
