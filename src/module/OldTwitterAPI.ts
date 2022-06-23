import Twitter from "twitter";
import { getEnv } from "../util/env";
import fs from "fs";

export class OldTwitterAPI {
  private client: Twitter;

  constructor(isForTest = true) {
    if (isForTest) {
      this.client = new Twitter({
        consumer_key: getEnv("TEST_TWITTER_API_CONSUMER_KEY"),
        consumer_secret: getEnv("TEST_TWITTER_API_CONSUMER_SECRET"),
        access_token_key: getEnv("TEST_TWITTER_API_ACCESS_TOKEN_KEY"),
        access_token_secret: getEnv("TEST_TWITTER_API_ACCESS_TOKEN_SECRET"),
      });
    } else {
      this.client = new Twitter({
        consumer_key: getEnv("TWITTER_API_CONSUMER_KEY"),
        consumer_secret: getEnv("TWITTER_API_CONSUMER_SECRET"),
        access_token_key: getEnv("TWITTER_API_ACCESS_TOKEN_KEY"),
        access_token_secret: getEnv("TWITTER_API_ACCESS_TOKEN_SECRET"),
      });
    }
  }

  public async tweet(
    text: string,
    imagePaths?: string[],
    inReplyToStatusId?: string
  ) {
    let options = {};
    if (imagePaths) {
      if (imagePaths.length > 4) {
        throw new Error("ツイートに載せられる画像は4つまでです。");
      }

      const mediaIds = await Promise.all(
        imagePaths.map(async (imagePath) => {
          return await this.uploadImageFromFile(imagePath);
        })
      );
      options = { media_ids: mediaIds.join(",") };
    }
    if (inReplyToStatusId) {
      options = {
        in_reply_to_status_id: inReplyToStatusId,
        auto_populate_reply_metadata: true,
        ...options,
      };
    }

    const maxTweet = text.substring(0, 140);
    const nextTweet = text.substring(140);

    const body: string = await new Promise((resolve, reject) => {
      this.client.post(
        "statuses/update",
        { status: maxTweet, ...options },
        (err, maxTweet, res) => {
          if (!err) {
            resolve(res.body);
          } else {
            console.error(err);
            reject(err);
          }
        }
      );
    });
    const data = JSON.parse(body);

    if (nextTweet.length > 0) {
      await this.tweet(nextTweet, undefined, data.id_str);
    }

    return body;
  }

  public async uploadImageFromFile(path: string): Promise<string> {
    const image = fs.readFileSync(path);
    return new Promise((resolve, reject) => {
      this.client.post(
        "media/upload",
        { media: image },
        (err, media, response) => {
          if (err) {
            reject(err);
          }
          resolve(media.media_id_string);
        }
      );
    });
  }
}
