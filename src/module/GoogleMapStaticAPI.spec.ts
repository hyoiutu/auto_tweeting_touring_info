import { GoogleMapStaticAPI } from "./GoogleMapStaticAPI";
import fs from "fs";
import { exec } from "child_process";

describe("GoogleMapStaticAPI.ts", () => {
  describe("build", () => {
    it("GoogleMapStaticAPIのインスタンスが返ってくる", () => {
      expect(GoogleMapStaticAPI.build()).toBeInstanceOf(GoogleMapStaticAPI);
    });
  });
  describe("getRouteMap", () => {
    const googleMapStaticAPI = GoogleMapStaticAPI.build();
    it("マップの画像が返ってくる", async () => {
      await googleMapStaticAPI.getRouteMap({
        polyline: "w_eve_ojipy_",
        fileName: "test-img",
      });

      expect(fs.readFileSync("./routeImg/test-img.jpg")).toBeInstanceOf(Buffer);
    });
  });
});

afterAll(() => {
  exec("rm ./routeImg/test-img.jpg");
});
