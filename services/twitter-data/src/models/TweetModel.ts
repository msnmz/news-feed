export interface TweetModel {
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

export const TweetModelKeys = [
  'created_at',
  'id_str',
  'text',
  'full_text',
  'lang',
  'coordinates',
  'place',
];

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

export const TweeterUserModelKeys = [
  'id_str',
  'name',
  'screen_name',
  'description',
  'location',
  'url',
  'profile_background_image_url',
  'profile_image_url',
  'profile_banner_url',
];

export interface TweetUrlModel {
  url: string;
  expanded_url: string;
  indices: [number, number];
}

export const TweetUrlModelKeys = ['url', 'expanded_url', 'indices'];

export interface TweetHashtagModel {
  text: string;
  indices: [number, number];
}

export const TweetHashtagModelKeys = ['text', 'indices'];
