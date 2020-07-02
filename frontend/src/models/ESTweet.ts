export interface ESTweet {
  created_at: string;
  id_str: string;
  text: string;
  full_text?: string;
  lang: string;
  coordinates?: string;
  place?: string;
  user: TweeterUserModel;
  entities?: {
    urls?: TweetUrlModel[];
    hashtags?: TweetHashtagModel[];
  };
}

export interface TweeterUserModel {
  id_str: string;
  name: string;
  screen_name: string;
  description: string;
  location: string;
  url?: string;
  profile_background_image_url: string;
  profile_image_url: string;
  profile_banner_url: string;
}

export interface TweetUrlModel {
  url: string;
  expanded_url: string;
  indices: [number, number];
}

export interface TweetHashtagModel {
  text: string;
  indices: [number, number];
}
