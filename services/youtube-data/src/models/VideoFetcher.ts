import { google, youtube_v3 } from 'googleapis';
import { YoutubeVideoModel } from './types/YoutubeVideoModel';

export default class VideoFetcher {
  private youtube: youtube_v3.Youtube;
  private apiKeys: string[] = process.env.GOOGLE_API_KEYS!.split(',');
  private indexInUse: number = 0;
  private failedTrials: number = 0;

  constructor() {
    this.youtube = this.setAPIHandler();
  }

  private setAPIHandler() {
    return google.youtube({
      version: 'v3',
      auth: this.apiKeys[this.indexInUse],
    });
  }

  async search(title: string): Promise<YoutubeVideoModel[]> {
    try {
      const data = await this.youtube.search.list({
        part: ['snippet'],
        q: title,
      });
      this.failedTrials = 0;
      const mappedSearchResults: Array<YoutubeVideoModel> = [];
      if (data.data && data.data.items) {
        const items = data.data.items;
        items.forEach((item: youtube_v3.Schema$SearchResult) => {
          mappedSearchResults.push({
            youtubeId: {
              kind: item.id?.kind,
              videoId: item.id?.videoId,
            },
            publishedAt: item.snippet?.publishedAt,
            title: item.snippet?.title,
            description: item.snippet?.description,
            channelId: item.snippet?.channelId,
            channelTitle: item.snippet?.channelTitle,
            thumbnails: {
              default: { ...item.snippet?.thumbnails?.default },
              medium: { ...item.snippet?.thumbnails?.medium },
              high: { ...item.snippet?.thumbnails?.high },
            },
            publishedTime: item.snippet?.publishedAt,
          });
        });
      }
      return mappedSearchResults;
    } catch (err) {
      console.log(`Error caught: ${err.message}. Trying different key.`);
      console.log({ err });
      if (++this.failedTrials > this.apiKeys.length) {
        return [];
      }
      this.indexInUse = (this.indexInUse + 1) % this.apiKeys.length;
      this.youtube = this.setAPIHandler();
      return await this.search(title);
    }
  }
}
