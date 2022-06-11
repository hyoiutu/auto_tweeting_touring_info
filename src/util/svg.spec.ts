import {
  generateSVGByRegions,
  getFeaturesByGeoJSONList,
  getSVGByBbox,
  readTopoJSON,
  topoToGeo,
} from "./svg";
import { Topology } from "topojson-specification";
import { getMaxBboxByBboxList, getMidLatLng } from "./latlng";
import { execSync } from "child_process";
import fs from "fs";
import { JSDOM } from "jsdom";

const testDir = "./testFiles";

beforeAll(() => {
  if (!fs.existsSync(testDir)) {
    execSync(`mkdir ${testDir}`);
  }
});

describe("svg.ts", () => {
  describe("readTopoJSON", () => {
    it("Topology型が返ってくる", () => {
      const result = readTopoJSON("./topojson/test2.topojson");
      expect(result.type).toBe("Topology");
      expect(result.objects).toBeDefined();
    });
  });

  let featureCollectionTopojson: Topology;
  let featureTopojson: Topology;
  let invalidTopojson: Topology;

  beforeEach(() => {
    featureCollectionTopojson = readTopoJSON("./topojson/test.topojson");
    featureTopojson = readTopoJSON("./topojson/test2.topojson");
    invalidTopojson = readTopoJSON("./topojson/test3.topojson");
  });
  describe("topoToGeo", () => {
    describe("GeometryのtypeがGeometryCollectionだった場合", () => {
      it("FeatureCollection型が返ってくる", () => {
        const result = topoToGeo(
          featureCollectionTopojson,
          featureCollectionTopojson.objects.city
        );
        expect(result.type).toBe("FeatureCollection");
      });
    });
    describe("GeometryのtypeがGeometryCollectionではない場合", () => {
      it("Feature型が返ってくる", () => {
        const result = topoToGeo(featureTopojson, featureTopojson.objects.city);
        expect(result.type).toBe("Feature");
      });
    });
    describe("typeプロパティがない場合", () => {
      it("エラーが投げられる", () => {
        expect(() => {
          topoToGeo(invalidTopojson, invalidTopojson.objects.city);
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
          return topoToGeo(topoJsonData, topoJsonData.objects.city);
        });
        const result = getFeaturesByGeoJSONList(geoJsonDataList);
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
          return topoToGeo(topoJsonData, topoJsonData.objects.city);
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
      const features = getFeaturesByGeoJSONList(geoJsonDataList);
      const { document } = getSVGByBbox(
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
    it("指定した市町村に色が塗られている", async () => {
      await generateSVGByRegions(
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
  });
});

afterAll(() => {
  execSync(`rm -rf ${testDir}`);
});
