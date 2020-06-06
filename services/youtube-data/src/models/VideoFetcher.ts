import { google, youtube_v3 } from 'googleapis';
import { YoutubeVideoModel } from './types/YoutubeVideoModel';

export default class VideoFetcher {
  private youtube: youtube_v3.Youtube;

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.GOOGLE_API_KEY_2,
    });
  }

  async search(title: string): Promise<YoutubeVideoModel[]> {
    try {
      const data = await this.youtube.search.list({
        part: ['snippet'],
        q: title,
      });
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
      throw err;
    }
  }
}
