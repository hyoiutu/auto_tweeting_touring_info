import crypto from "crypto";
import url from "url";

import { googleMapStaticAxios } from "../axios";
import fs from "fs";
import { API_KEY, SIGNATURE_SECRET } from "../../constants/googleMapStaticAPI";
import { stringify } from "querystring";
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

  public async testAPI() {
    const unsignApiPath = `https://maps.googleapis.com/maps/api/staticmap?center=40.714%2c%20-73.998&zoom=12&size=400x400&key=${this.apiKey}`;
    const signedApiPath = await this.sign(unsignApiPath, this.signatureSecret);
    const res = await axios.get(signedApiPath, { responseType: "arraybuffer" });
    fs.writeFileSync("./hoge.jpg", Buffer.from(res.data), "binary");
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
