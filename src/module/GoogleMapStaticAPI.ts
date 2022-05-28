import crypto from "crypto";
import url from "url";

import fs from "fs";
import { API_KEY, SIGNATURE_SECRET } from "../../constants/googleMapStaticAPI";
import axios from "axios";

export class GoogleMapStaticAPI {
  private apiKey: string;
  private signatureSecret: string;
  constructor() {
    this.apiKey = API_KEY;
    this.signatureSecret = SIGNATURE_SECRET;
  }

  public static build() {
    const googleMapStaticAPI = new GoogleMapStaticAPI();
    return googleMapStaticAPI;
  }

  public async getRouteMap(args: { polyline: string; fileName: string }) {
    const baseUrl = "https://maps.googleapis.com/maps/api/staticmap";
    const size = "400x400";
    const weight = "5";
    const color = "blue";
    const path = `weight:${weight}%7Ccolor:${color}%7Cenc:${encodeURI(
      args.polyline
    )}`;

    const unsignApiPath = `${baseUrl}?size=${size}&path=${path}&key=${this.apiKey}`;
    const signedApiPath = await this.sign(unsignApiPath, this.signatureSecret);

    const res = await axios.get(signedApiPath, {
      responseType: "arraybuffer",
    });

    fs.writeFileSync(
      `./routeImg/${args.fileName}.jpg`,
      Buffer.from(res.data),
      "binary"
    );
  }

  private removeWebSafe(safeEncodedString: string) {
    return safeEncodedString.replace(/-/g, "+").replace(/_/g, "/");
  }
  private makeWebSafe(encodedString: string) {
    return encodedString.replace(/\+/g, "-").replace(/\//g, "_");
  }
  private decodeBase64Hash(code: string) {
    return Buffer.from(code, "base64");
  }

  private encodeBase64Hash(key: Buffer, data: string) {
    return crypto.createHmac("sha1", key).update(data).digest("base64");
  }
  private async sign(apiPath: string, signatureSecret: string) {
    const uri = new URL(apiPath);
    const safeSecret = this.decodeBase64Hash(
      this.removeWebSafe(signatureSecret)
    );
    const hashedSignature = this.makeWebSafe(
      this.encodeBase64Hash(safeSecret, uri.pathname + uri.search)
    );
    return url.format(uri) + "&signature=" + hashedSignature;
  }
}
