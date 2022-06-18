import { BBox, Feature } from "geojson";
import { geometryToPositions } from "./svg";

export function getMaxBboxByBboxList(bboxList: BBox[]): BBox {
  const minLng = Math.min(...bboxList.map((bbox) => [bbox[0], bbox[2]]).flat());
  const minLat = Math.min(...bboxList.map((bbox) => [bbox[1], bbox[3]]).flat());
  const maxLng = Math.max(...bboxList.map((bbox) => [bbox[0], bbox[2]]).flat());
  const maxLat = Math.max(...bboxList.map((bbox) => [bbox[1], bbox[3]]).flat());
  return [minLng, minLat, maxLng, maxLat];
}

export function getMaxBboxByFeatures(features: Feature[]) {
  const candidateBBox = features
    .map((feature) => {
      return geometryToPositions(feature.geometry);
    })
    .flat();

  const minLng = candidateBBox
    .slice()
    .sort((a, b) => (a[1] > b[1] ? -1 : 1))[0][0];
  const minLat = candidateBBox
    .slice()
    .sort((a, b) => (a[0] > b[0] ? -1 : 1))[0][1];
  const maxLng = candidateBBox
    .slice()
    .sort((a, b) => (a[1] > b[1] ? 1 : -1))[0][0];
  const maxLat = candidateBBox
    .slice()
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))[0][1];

  return [minLng, minLat, maxLng, maxLat] as BBox;
}
