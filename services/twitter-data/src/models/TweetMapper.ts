import {
  TweetModel,
  TweetHashtagModel,
  TweetHashtagModelKeys,
  TweetModelKeys,
  TweeterUserModel,
  TweeterUserModelKeys,
  TweetUrlModel,
  TweetUrlModelKeys,
} from './TweetModel';

export class TweetMapper {
  static map(_tweets: any[]): Array<TweetModel> {
    let tweets: Array<TweetModel> = [];

    _tweets.forEach((_tweet) => {
      let tweet = this.mapProp<TweetModel>(_tweet, TweetModelKeys);
      tweet.user = this.mapProp<TweeterUserModel>(_tweet.user, TweeterUserModelKeys);
      if (_tweet.entities) {
        let entities: { urls?: TweetUrlModel[]; hashtags?: TweetHashtagModel[] } = {};
        if (_tweet.entities.urls) {
          entities.urls = this.mapProps<TweetUrlModel>(_tweet.entities.urls, TweetUrlModelKeys);
        }
        if (_tweet.entities.hashtags) {
          entities.hashtags = this.mapProps<TweetHashtagModel>(
            _tweet.entities.hashtags,
            TweetHashtagModelKeys,
          );
        }
        tweet.entities = entities;
      }
      tweets.push(tweet);
    });

    return tweets;
  }

  private static mapProp<T>(_prop: any, keys: string[]): T {
    return keys.reduce(
      (prop: T, key: string) => (_prop[key] ? { ...prop, [key]: _prop[key] } : prop),
      {} as T,
    );
  }

  private static mapProps<T>(_props: any[], keys: string[]): Array<T> {
    return _props.map((_prop) => this.mapProp<T>(_prop, keys));
  }
}
