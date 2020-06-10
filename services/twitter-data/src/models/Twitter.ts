import fetch from 'node-fetch';
import TwitterAPI from 'twitter';
import { TweetMapper } from './TweetMapper';
import { TweetModel } from './TweetModel';
import { RawNews } from '../../../shared/models/RawNews';
import { EnhancedTwitterNews } from './types/EnhancedTwitterNews';

export class Twitter {
  private credentials = {
    consumer_key: process.env.TWITTER_APP_API_KEY!,
    consumer_secret: process.env.TWITTER_APP_API_SECRET!,
    bearer_token: process.env.TWITTER_APP_BEARER_TOKEN!,
  };

  private tweeter: TwitterAPI;

  constructor() {
    this.tweeter = new TwitterAPI(this.credentials);
  }

  async search(query: string): Promise<Array<TweetModel>> {
    console.log(`Searching tweeter for: ${query}`);
    const { search_metadata, statuses } = await this.tweeter.get('search/tweets', { q: query });
    let tweetModels: Array<TweetModel> = [];
    if (!search_metadata || !search_metadata.count || !statuses) {
      console.log(`No results for ${query}`);
      return tweetModels;
    }
    tweetModels = TweetMapper.map(statuses);
    console.log(`Search completed for: ${query} with ${tweetModels.length} results.`);
    return tweetModels;
  }

  async bulkSearch(queries: Array<RawNews>): Promise<Array<EnhancedTwitterNews>> {
    console.log(`Bulk search started for ${queries.length} news.`);
    const enhancedNews: Array<EnhancedTwitterNews> = [];
    const results = { success: 0, failure: 0 };
    for (const rawNews of queries) {
      let enhanced: EnhancedTwitterNews = { ...rawNews, tweets: [] };
      try {
        enhanced.tweets = await this.search(rawNews.title);
        results.success++;
      } catch (error) {
        console.log(`Tweeter error for news (${rawNews.title}): ${error.message}`);
        results.failure++;
      }
      enhancedNews.push(enhanced);
    }
    console.log(
      `Bulk search completed for ${queries.length} news with ${results.success} success and ${results.failure} failures.`,
    );
    return enhancedNews;
  }
}
