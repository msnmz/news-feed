import { google } from 'googleapis';

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.GOOGLE_API_KEY,
});

youtube.search.list(
  {
    part: ['snippet'],
    q: "Nation's public schools need major repairs, report finds",
  },
  (err: Error | null, data) => {
    if (err) {
      console.error('Error: ' + err);
    }
    if (data && data.data && data.data.items) {
      const items = data.data.items;

      console.log(JSON.stringify(items, null, 2));
    }
  },
);
