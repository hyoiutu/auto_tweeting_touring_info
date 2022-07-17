import { readTopoJSON } from "./svg/svg";
import * as topojson from "topojson-client";
import * as d3 from "d3";
import { JSDOM } from "jsdom";
import fs from "fs";
import { openReverseGeocoder } from "@geolonia/open-reverse-geocoder";
import polyline from "@mapbox/polyline";
import { Topology } from "topojson-specification";
import { getMidLatLng } from "./svg/latlng";
import sharp from "sharp";

async function main() {
  const document = new JSDOM().window.document;
  const topo: Topology = JSON.parse(
    fs.readFileSync("./topojson/01_city.i.topojson", "utf-8")
  );

  const bbox = topo.bbox;

  console.log({ bbox });

  if (!bbox) {
    throw new Error();
  }

  const geo = topojson.feature(topo, topo.objects.city);

  const features =
    geo.type === "FeatureCollection"
      ? geo.features
      : geo.type === "Feature"
        ? [geo]
        : undefined;
  if (!features) {
    throw new Error();
  }

  const width = 800;
  const height = 800;

  const originProjection = d3.geoMercator().scale(1);

  const minPosition = originProjection([bbox[0], bbox[1]]) ?? [0, 0];
  const maxPosition = originProjection([bbox[2], bbox[3]]) ?? [0, 0];

  console.log({ minPosition, maxPosition });

  const originWidth = Math.abs(maxPosition[0] - minPosition[0]);
  const originHeight = Math.abs(maxPosition[1] - minPosition[1]);

  console.log({ originWidth, originHeight });

  const scaleX = width / originWidth;
  const scaleY = height / originHeight;

  console.log({ scaleX, scaleY });

  const scale = 0.95 * Math.min(scaleX, scaleY);
  console.log({ scale });
  const { midLat, midLng } = getMidLatLng(
    { lat: bbox[1], lng: bbox[0] },
    { lat: bbox[3], lng: bbox[2] }
  );
  const aProjection = d3
    .geoMercator()
    .center([midLng, midLat])
    .translate([width / 2, height / 2])
    .scale(scale);
  const geoPath = d3.geoPath().projection(aProjection);
  const d3Svg = d3
    .select(document.body)
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", 800)
    .attr("height", 800);

  d3Svg
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("d", geoPath)
    .attr("class", (d) => {
      return d.id ? d.id : "unknown";
    })
    .style("stroke", "#000000")
    .style("stroke-width", 1)
    .style("fill", "#ffffff");

  fs.writeFileSync("./hoge.svg", document.body.innerHTML);

  await sharp("./hoge.svg").png().toFile("./hoge.png");
}
function latLngToPixels(arg: { lat: number; lng: number }) {
  const [radLat, radLng] = [degreeToRadian(arg.lat), degreeToRadian(arg.lng)];
  return {
    x: Math.cos(radLng) * Math.cos(radLat),
    y: Math.cos(radLat) * Math.sin(radLng),
    z: Math.sin(radLat),
  };
}

function degreeToRadian(degree: number) {
  return degree * (Math.PI / 180);
}

function radianToDegree(radian: number) {
  return (radian * 180) / Math.PI;
}
/*
  const geo = topojson.feature(topo, topo.objects.city);

  const features =
    geo.type === "FeatureCollection"
      ? geo.features
      : geo.type === "Feature"
      ? [geo]
      : undefined;
  if (!features) {
    throw new Error();
  }

  const aProjection = d3
    .geoMercator()
    .center([142.6960534, 43.4259796])
    .translate([400, 400])
    .scale(5000);
  const geoPath = d3.geoPath().projection(aProjection);
  const d3Svg = d3
    .select(document.body)
    .append("svg")
    .attr("xmlns", "http://www.w3.org/2000/svg")
    .attr("width", 800)
    .attr("height", 800);

  d3Svg
    .selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("d", geoPath)
    .attr("class", (d) => {
      return d.id ? d.id : "unknown";
    })
    .style("stroke", "#000000")
    .style("stroke-width", 1)
    .style("fill", "#ffffff");

  d3Svg.select(".北海道北見市").style("fill", "blue");
  d3Svg.select(".北海道宗谷郡猿払村").style("fill", "red");
  d3Svg.select(".北海道雨竜郡幌加内町").style("fill", "yellow");
  d3Svg.select(".北海道釧路市").style("fill", "green");
  fs.writeFileSync("./hoge.svg", document.body.innerHTML);
  */

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
