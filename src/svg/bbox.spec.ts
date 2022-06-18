import { getMaxBboxByBboxList, getMaxBboxByFeatures } from "./bbox";
import { Feature, Geometry } from "geojson";

describe("bbox.ts", () => {
  describe("getMaxBboxByFeatures", () => {
    let features: Feature[];
    beforeEach(() => {
      const geometries = [
        {
          type: "Point",
          coordinates: [0, 12],
        },
        {
          type: "Polygon",
          coordinates: [
            [
              [1, 11],
              [2, 10],
            ],
            [
              [3, 9],
              [4, 8],
            ],
          ],
        },
        {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [5, 7],
                [6, 6],
              ],
              [
                [7, 5],
                [8, 4],
              ],
            ],
            [
              [
                [9, 3],
                [10, 2],
              ],
              [
                [11, 1],
                [12, 0],
              ],
            ],
          ],
        },
      ] as Geometry[];
      features = geometries.map((geometry) => {
        return {
          type: "Feature",
          geometry,
          properties: {},
        };
      });
    });
    it("coordinatesの端をBBoxで返す", () => {
      const result = getMaxBboxByFeatures(features);
      expect(result).toStrictEqual([0, 0, 12, 12]);
    });
  });

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
});
