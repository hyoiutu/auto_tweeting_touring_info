import { openReverseGeocoder } from "@geolonia/open-reverse-geocoder";

export function getMidLatLng(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
) {
  const aPixels = latLngToPixels(a);
  const bPixels = latLngToPixels(b);

  // 正規化するので1/2する必要なし
  const midPixels = {
    x: aPixels.x + bPixels.x,
    y: aPixels.y + bPixels.y,
    z: aPixels.z + bPixels.z,
  };

  const midVectorLength = Math.sqrt(
    midPixels.x ** 2 + midPixels.y ** 2 + midPixels.z ** 2
  );

  const normalizedMidPixels = {
    x: midPixels.x / midVectorLength,
    y: midPixels.y / midVectorLength,
    z: midPixels.z / midVectorLength,
  };

  const midLat = radianToDegree(Math.asin(normalizedMidPixels.z));
  const midLng = radianToDegree(
    Math.atan2(normalizedMidPixels.y, normalizedMidPixels.x)
  );

  return { midLat, midLng };
}

export function latLngToPixels(arg: { lat: number; lng: number }) {
  const [radLat, radLng] = [degreeToRadian(arg.lat), degreeToRadian(arg.lng)];
  return {
    x: Math.cos(radLng) * Math.cos(radLat),
    y: Math.cos(radLat) * Math.sin(radLng),
    z: Math.sin(radLat),
  };
}

export function degreeToRadian(degree: number) {
  return degree * (Math.PI / 180);
}

export function radianToDegree(radian: number) {
  return (radian * 180) / Math.PI;
}

export async function getCityByLatLng(args: { lng: number; lat: number }) {
  const res = await openReverseGeocoder([args.lng, args.lat]);
  return res.prefecture + res.city;
}
