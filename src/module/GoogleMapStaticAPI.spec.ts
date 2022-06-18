import { GoogleMapStaticAPI } from "./GoogleMapStaticAPI";
import fs from "fs";
import { getEnv } from "../util/env";

const testDir = getEnv("TEST_FILES_DIR");

describe("GoogleMapStaticAPI.ts", () => {
  describe("build", () => {
    it("GoogleMapStaticAPIのインスタンスが返ってくる", () => {
      expect(GoogleMapStaticAPI.build()).toBeInstanceOf(GoogleMapStaticAPI);
    });
  });
  describe("getRouteMap", () => {
    const googleMapStaticAPI = GoogleMapStaticAPI.build();
    it("マップの画像が返ってくる", async () => {
      await googleMapStaticAPI.getRouteMap(
        "w_eve_ojipy_",
        `${testDir}/test-img.jpg`
      );

      expect(fs.readFileSync(`${testDir}/test-img.jpg`)).toBeInstanceOf(Buffer);
    });
  });
});
