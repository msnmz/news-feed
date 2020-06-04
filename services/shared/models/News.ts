export type News = {
  source: {
    id?: string;
    name?: string;
    description?: string;
    url?: string;
    category?: string;
    language?: string;
    country?: string;
  };
  author?: string;
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  content?: string;
};
