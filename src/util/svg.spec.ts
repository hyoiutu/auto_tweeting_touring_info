import * as svg from "./svg";
import { Topology } from "topojson-specification";
import { getMaxBboxByBboxList, getMidLatLng } from "./latlng";
import fs from "fs";
import { JSDOM } from "jsdom";
import { Feature, Geometry, GeometryCollection, Position } from "geojson";
import * as latlng from "./latlng";
import { getEnv } from "./env";

const testDir = getEnv("TEST_FILES_DIR");

describe("svg.ts", () => {
  describe("readTopoJSON", () => {
    it("Topology型が返ってくる", () => {
      const result = svg.readTopoJSON("./topojson/test2.topojson");
      expect(result.type).toBe("Topology");
      expect(result.objects).toBeDefined();
    });
  });

  let featureCollectionTopojson: Topology;
  let featureTopojson: Topology;
  let invalidTopojson: Topology;

  beforeEach(() => {
    featureCollectionTopojson = svg.readTopoJSON("./topojson/test.topojson");
    featureTopojson = svg.readTopoJSON("./topojson/test2.topojson");
    invalidTopojson = svg.readTopoJSON("./topojson/test3.topojson");
  });
  describe("topoToGeo", () => {
    describe("GeometryのtypeがGeometryCollectionだった場合", () => {
      it("FeatureCollection型が返ってくる", () => {
        const result = svg.topoToGeo(
          featureCollectionTopojson,
          featureCollectionTopojson.objects.city
        );
        expect(result.type).toBe("FeatureCollection");
      });
    });
    describe("GeometryのtypeがGeometryCollectionではない場合", () => {
      it("Feature型が返ってくる", () => {
        const result = svg.topoToGeo(
          featureTopojson,
          featureTopojson.objects.city
        );
        expect(result.type).toBe("Feature");
      });
    });
    describe("typeプロパティがない場合", () => {
      it("エラーが投げられる", () => {
        expect(() => {
          svg.topoToGeo(invalidTopojson, invalidTopojson.objects.city);
        }).toThrow("typeがありません");
      });
    });
  });
  describe("getFeaturesByGeoJSONList", () => {
    describe("FeatureCollectionとFeatureが混在している場合", () => {
      it("Featureの配列が返ってくる", () => {
        const geoJsonDataList = [
          featureCollectionTopojson,
          featureTopojson,
        ].map((topoJsonData) => {
          return svg.topoToGeo(topoJsonData, topoJsonData.objects.city);
        });
        const result = svg.getFeaturesByGeoJSONList(geoJsonDataList);
        expect(result.map((v) => v.type)).toStrictEqual(
          Array(result.length).fill("Feature")
        );
      });
    });
  });
  describe("getSVGByBbox", () => {
    it("SVGのソースが返ってくる", () => {
      const geoJsonDataList = [featureCollectionTopojson, featureTopojson].map(
        (topoJsonData) => {
          return svg.topoToGeo(topoJsonData, topoJsonData.objects.city);
        }
      );
      const bboxList = geoJsonDataList
        .map((geoJsonData) => geoJsonData.bbox)
        .filter((v): v is Exclude<typeof v, undefined> => v !== undefined);
      const [minLng, minLat, maxLng, maxLat] = getMaxBboxByBboxList(bboxList);

      const width = 600;
      const height = 600;

      const { midLat, midLng } = getMidLatLng(
        { lat: maxLat, lng: maxLng },
        { lat: minLat, lng: minLng }
      );
      const features = svg.getFeaturesByGeoJSONList(geoJsonDataList);
      const { document } = svg.getSVGByBbox(
        [minLng, minLat, maxLng, maxLat],
        features,
        width,
        height,
        { lat: midLat, lng: midLng },
        (d) => {
          return d.type ? d.type : "unknown";
        }
      );

      expect(document.body.getElementsByTagName("svg").length).toBe(1);
      expect(
        document.body.getElementsByTagName("svg").item(0)?.getAttribute("width")
      ).toBe(width.toString());
      expect(
        document.body
          .getElementsByTagName("svg")
          .item(0)
          ?.getAttribute("height")
      ).toBe(height.toString());

      expect(document.body.getElementsByClassName("Feature").length).toBe(4);
    });
  });

  describe("generateSVGByRegions", () => {
    let mockGetMaxBboxByBboxList: jest.SpyInstance;
    let mockGetMaxBboxByFeatures: jest.SpyInstance;
    beforeEach(() => {
      mockGetMaxBboxByBboxList = jest.spyOn(latlng, "getMaxBboxByBboxList");
      mockGetMaxBboxByFeatures = jest.spyOn(svg, "getMaxBboxByFeatures");
    });
    it("指定した市町村に色が塗られている", async () => {
      await svg.generateSVGByRegions(
        ["北海道札幌市中央区", "東京都大島町"],
        `${testDir}/test.svg`
      );
      const svgSource = fs.readFileSync(`${testDir}/test.svg`, "utf-8");

      const document = new JSDOM(svgSource).window.document;

      expect(
        document.body
          .getElementsByClassName("北海道札幌市中央区")
          .item(0)
          ?.getAttribute("style")
      ).toBe("stroke: #000000; stroke-width: 0.1; fill: #5EAFC6;");

      expect(
        document.body
          .getElementsByClassName("東京都大島町")
          .item(0)
          ?.getAttribute("style")
      ).toBe("stroke: #000000; stroke-width: 0.1; fill: #5EAFC6;");

      expect(
        document.body
          .getElementsByClassName("東京都品川区")
          .item(0)
          ?.getAttribute("style")
      ).toBe("stroke: #000000; stroke-width: 0.1; fill: #ffffff;");

      expect(document.body.getElementsByClassName("沖縄県那覇市").length).toBe(
        0
      );
    });
    describe("options.plotAreaにprefectureを指定した場合", () => {
      it("getMaxBboxByBboxListが呼ばれる", async () => {
        await svg.generateSVGByRegions(
          ["北海道札幌市中央区", "東京都大島町"],
          `${testDir}/test.svg`,
          { plotArea: "prefecture" }
        );
        expect.assertions(2);
        expect(mockGetMaxBboxByBboxList).toBeCalled();
        expect(mockGetMaxBboxByFeatures).not.toBeCalled();
      });
    });
    describe("options.plotAreaにregionsを指定した場合", () => {
      it("getMaxBboxByFeaturesが呼ばれる", async () => {
        await svg.generateSVGByRegions(
          ["北海道札幌市中央区", "東京都大島町"],
          `${testDir}/test.svg`,
          { plotArea: "regions" }
        );
        expect.assertions(2);
        expect(mockGetMaxBboxByBboxList).not.toBeCalled();
        expect(mockGetMaxBboxByFeatures).toBeCalled();
      });
    });
    describe("options.plotAreaを指定していない場合", () => {
      it("getMaxBboxByFeaturesが呼ばれる", async () => {
        await svg.generateSVGByRegions(
          ["北海道札幌市中央区", "東京都大島町"],
          `${testDir}/test.svg`
        );
        expect.assertions(2);
        expect(mockGetMaxBboxByBboxList).not.toBeCalled();
        expect(mockGetMaxBboxByFeatures).toBeCalled();
      });
    });
  });

  describe("geometryToPositions", () => {
    describe("geometryのtypeがGeometryCollectionだった場合", () => {
      let geometry: GeometryCollection;
      let result: Position[];
      let mockGeometyToPositions: jest.SpyInstance;
      beforeEach(() => {
        geometry = {
          type: "GeometryCollection",
          geometries: [
            { type: "Point", coordinates: [0, 1] },
            {
              type: "MultiPoint",
              coordinates: [
                [1, 2],
                [2, 3],
              ],
            },
          ],
        };

        mockGeometyToPositions = jest.spyOn(svg, "geometryToPositions");

        result = svg.geometryToPositions(geometry);
      });
      it("geometryToPositionsが再帰的に2回呼ばれる", () => {
        expect.assertions(4);

        // 最初の1回 + 再帰2回
        expect(mockGeometyToPositions).toBeCalledTimes(3);

        expect(mockGeometyToPositions).toBeCalledWith(geometry);
        expect(mockGeometyToPositions).toBeCalledWith({
          type: "Point",
          coordinates: [0, 1],
        });
        expect(mockGeometyToPositions).toBeCalledWith({
          type: "MultiPoint",
          coordinates: [
            [1, 2],
            [2, 3],
          ],
        });
      });
      it("coordinatesがflatになって返ってくる", () => {
        expect(result).toStrictEqual([
          [0, 1],
          [1, 2],
          [2, 3],
        ]);
      });
    });
    describe("geometryのtypeがGeometryCollection以外だった場合", () => {
      let geometry: Geometry;
      let result: Position[];
      let mockGeometyToPositions: jest.SpyInstance;
      beforeEach(() => {
        geometry = {
          type: "MultiPoint",
          coordinates: [
            [1, 2],
            [2, 3],
          ],
        };
        mockGeometyToPositions = jest.spyOn(svg, "geometryToPositions");
        result = svg.geometryToPositions(geometry);
      });
      it("再帰的に関数は呼ばれない", () => {
        expect.assertions(2);
        expect(mockGeometyToPositions).toBeCalledTimes(1);
        expect(mockGeometyToPositions).toBeCalledWith(geometry);
      });
      it("coordinatesがflatになって返ってくる", () => {
        expect(result).toStrictEqual([
          [1, 2],
          [2, 3],
        ]);
      });
    });
  });

  describe("getFeaturesByRegions", () => {
    let features: Feature[];
    let expectFeatures: Feature[];
    beforeEach(() => {
      const exampleGeometry = {
        type: "Point",
        coordinates: [0, 1],
      } as Geometry;
      features = [
        {
          type: "Feature",
          id: "stringId",
          geometry: exampleGeometry,
          properties: {},
        },
        {
          type: "Feature",
          id: 2,
          geometry: exampleGeometry,
          properties: {},
        },
        {
          type: "Feature",
          geometry: exampleGeometry,
          properties: {},
        },
        {
          type: "Feature",
          id: "notSelectFeature",
          geometry: exampleGeometry,
          properties: {},
        },
      ];
      expectFeatures = [
        {
          type: "Feature",
          id: "stringId",
          geometry: exampleGeometry,
          properties: {},
        },
        {
          type: "Feature",
          id: 2,
          geometry: exampleGeometry,
          properties: {},
        },
      ];
    });
    describe("regionsとして['stringId', '2']を渡す場合", () => {
      it("stringIdと2のidを持つFeatureだけ返ってくる", () => {
        const result = svg.getFeaturesByRegions(["stringId", "2"], features);
        expect(result).toStrictEqual(expectFeatures);
      });
    });
  });

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
      const result = svg.getMaxBboxByFeatures(features);
      expect(result).toStrictEqual([0, 0, 12, 12]);
    });
  });
});
