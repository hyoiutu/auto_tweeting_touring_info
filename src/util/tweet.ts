import { StravaAPI } from "../module/StravaAPI";
import { getCityByLatLng } from "./staravaData";

export async function generateTweetByActivityId(
  stravaAPI: StravaAPI,
  activityId: string,
  sumDistance: number
) {
  const activity = await stravaAPI.getActivityDetailById(activityId);
  const distance_km = activity.distance / 1000;
  const startCity = await getCityByLatLng({
    lat: activity.start_latlng[1],
    lng: activity.start_latlng[0],
  });
  const endCity = await getCityByLatLng({
    lat: activity.end_latlng[1],
    lng: activity.end_latlng[0],
  });
  const tweet = `
    ${startCity}~${endCity}
    走行距離: ${distance_km}km
    総距離: ${distance_km + sumDistance}km
  `;

  return tweet;
}
