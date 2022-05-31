import { getCityByLatLng } from "./staravaData";
import * as geolonia from "@geolonia/open-reverse-geocoder";

describe("stravaData.ts", () => {
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
