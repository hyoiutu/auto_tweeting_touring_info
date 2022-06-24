import { OldTwitterAPI } from "./OldTwitterAPI";

export type TweetContent = {
  text: string;
  mediaPathList: string[];
  replyId?: string;
};

export class Tweet {
  private twitterAPI: OldTwitterAPI;
  constructor(twitterAPI: OldTwitterAPI) {
    this.twitterAPI = twitterAPI;
  }

  public async tweet(content: TweetContent) {
    return await this.twitterAPI.tweet(
      content.text,
      content.mediaPathList,
      content.replyId
    );
  }
  public async chainTweet(contents: TweetContent[]) {
    let replyId: string | undefined = undefined;
    for (const content of contents) {
      const resBody: string = await this.tweet({ ...content, replyId });
      replyId = JSON.parse(resBody).id_str;
    }
  }
}
