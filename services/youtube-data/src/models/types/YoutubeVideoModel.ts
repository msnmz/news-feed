export type YoutubeVideoModel = {
  youtubeId: {
    kind?: string | null;
    videoId?: string | null;
  };
  publishedAt?: string | null;
  publishedTime?: string | null;
  channelId?: string | null;
  channelTitle?: string | null;
  title?: string | null;
  description?: string | null;
  thumbnails?: {
    default?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
    };
    medium?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
    };
    high?: {
      url?: string | null;
      width?: number | null;
      height?: number | null;
    };
  };
};
