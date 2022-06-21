import { BBox, Feature } from "geojson";
import { getMaxByPrimitive, getMinByPrimitive } from "../util/util";
import { geometryToPositions } from "./svg";

export function getMaxBboxByBboxList(bboxList: BBox[]): BBox {
  const candidateLngList = bboxList.map((bbox) => [bbox[0], bbox[2]]).flat();
  const candidateLatList = bboxList.map((bbox) => [bbox[1], bbox[3]]).flat();

  const minLng = getMinByPrimitive(candidateLngList);
  const minLat = getMinByPrimitive(candidateLatList);
  const maxLng = getMaxByPrimitive(candidateLngList);
  const maxLat = getMaxByPrimitive(candidateLatList);

  return [minLng, minLat, maxLng, maxLat];
}

export function getMaxBboxByFeatures(features: Feature[]): BBox {
  const candidateBBox = features
    .map((feature) => {
      return geometryToPositions(feature.geometry);
    })
    .flat();

  const minLng = getMinByPrimitive(candidateBBox, (p) => p[0])[0];
  const minLat = getMinByPrimitive(candidateBBox, (p) => p[1])[1];
  const maxLng = getMaxByPrimitive(candidateBBox, (p) => p[0])[0];
  const maxLat = getMaxByPrimitive(candidateBBox, (p) => p[1])[1];

  return [minLng, minLat, maxLng, maxLat];
}
