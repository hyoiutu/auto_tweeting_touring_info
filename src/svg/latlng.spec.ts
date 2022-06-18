import { getMidLatLng, latLngToPixels, getCityByLatLng } from "./latlng";
import * as geolonia from "@geolonia/open-reverse-geocoder";

describe("latlng.ts", () => {
  describe("getMidLatLng", () => {
    it("2点の中間点を緯度経度で返す", () => {
      const mid = getMidLatLng({ lat: 45, lng: -145 }, { lat: -45, lng: 145 });
      expect(mid).toStrictEqual({ midLat: 0, midLng: 180 });
    });
  });

  describe("getCityByLatLng", () => {
    beforeEach(() => {
      jest.spyOn(geolonia, "openReverseGeocoder").mockResolvedValue({
        prefecture: "東京都",
        city: "品川区",
        code: "code",
      });
    });

    it("都道府県+市町村が返ってくる", async () => {
      const result = await getCityByLatLng({ lat: 123.456, lng: 78.912 });
      expect(result).toBe("東京都品川区");
    });
  });
});
