import { openReverseGeocoder } from "@geolonia/open-reverse-geocoder";

export async function getCityByLatLng(args: { lat: number; lng: number }) {
  const res = await openReverseGeocoder([args.lat, args.lng]);
  return res.prefecture + res.city;
}
