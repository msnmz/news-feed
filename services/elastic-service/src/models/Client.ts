import { Client } from '@elastic/elasticsearch';

export const client = new Client({
  cloud: {
    id: process.env.ELASTICSEARCH_CLOUD_ID!,
    username: process.env.ELASTICSEARCH_CLOUD_USERNAME!,
    password: process.env.ELASTICSEARCH_CLOUD_PASSWORD!,
  },
});
