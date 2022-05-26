import { openReverseGeocoder } from "@geolonia/open-reverse-geocoder";

export async function getCityByLatLng(args: { lat: number; lng: number }) {
  const { prefecture, city } = await openReverseGeocoder([args.lat, args.lng]);
  return prefecture + city;
}
