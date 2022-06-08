import { getMaxBboxByBboxList, getMidLatLng, latLngToPixels } from "./latlng";
describe("latlng.ts", () => {
  describe("getMaxBboxByBboxList", () => {
    it("複数のbboxを与えると、その中で最大になるbboxを形成して返す", () => {
      const result = getMaxBboxByBboxList([
        [10, 80, 20, 70],
        [30, 60, 40, 50],
        [50, 40, 60, 30],
        [70, 20, 80, 10],
      ]);
      expect(result).toStrictEqual([10, 10, 80, 80]);
    });
  });
  describe("getMidLatLng", () => {
    it("2点の中間点を緯度経度で返す", () => {
      const mid = getMidLatLng({ lat: 45, lng: -145 }, { lat: -45, lng: 145 });
      expect(mid).toStrictEqual({ midLat: 0, midLng: 180 });
    });
  });
});
