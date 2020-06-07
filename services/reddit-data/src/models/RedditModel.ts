export type RedditModel = {
  id?: string | null;
  subreddit?: string | null;
  subreddit_id?: string | null;
  author_fullname?: string | null;
  author?: string | null;
  title?: string | null;
  subreddit_name_prefixed?: string | null;
  subreddit_type?: string | null;
  ups?: number | null;
  downs?: number | null;
  total_awards_received?: number | null;
  is_original_content?: boolean | null;
  category?: string | null;
  score?: number | null;
  thumbnail?: string | null;
  created?: Date | null;
  domain?: string | null;
  url?: string | null;
  is_video?: boolean | null;
  is_self?: boolean | null;
  media?: boolean | null;
  self_text?: string | null;
  permalink?: string | null;
};

export const RedditModelKeys = [
  'id',
  'subreddit',
  'subreddit_id',
  'author_fullname',
  'author',
  'title',
  'subreddit_name_prefixed',
  'subreddit_type',
  'ups',
  'downs',
  'total_awards_received',
  'is_original_content',
  'category',
  'score',
  'thumbnail',
  'created',
  'domain',
  'url',
  'is_video',
  'is_self',
  'media',
  'self_text',
  'permalink',
];
