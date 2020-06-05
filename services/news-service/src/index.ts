import fetch from 'node-fetch';

import { NewsAPI, getTopHeadlinesForSingleSource } from '../lib';
import { MapperSourceRequestResponse } from '../../shared/responses/MapperSourceRequestResponse';
import { ISource } from '../../mapper/src/models/db/SourceModel';

const newsApi = new NewsAPI(process.env.NEWS_API_KEY!);

function requestSource() {
  fetch(`${process.env.MAPPER_URL}${process.env.SOURCE_REQUEST_ENDPOINT}`)
    .then((resp) => resp.json())
    .then((mapperResponse: MapperSourceRequestResponse) => {
      if (mapperResponse.updateRequest) {
        fetchSources().then(console.log).catch(console.error);
      } else {
        fetchHeadlines(mapperResponse.source!).then(console.log).catch(console.error);
      }
    })
    .catch(console.error);
}

async function fetchSources() {
  const sourceResponse = await newsApi.sources();
  const sourceAmount = sourceResponse.sources.length;
  if (sourceAmount === 0) return;
  fetch(`${process.env.MAPPER_URL}${process.env.SOURCE_SET_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources: sourceResponse.sources }),
  })
    .then((resp) => resp.json())
    .then((message) => console.log({ message }))
    .catch(console.error);
}

async function fetchHeadlines(source: ISource) {
  const headlines = await getTopHeadlinesForSingleSource(newsApi, source);
  fetch(`${process.env.MAPPER_URL}${process.env.HEADLINES_ENDPOINT}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...headlines,
      source,
    }),
  })
    .then((resp) => resp.json())
    .then((message) => console.log({ message }))
    .catch(console.error);
}

function main(): void {
  setInterval(async () => {
    requestSource();
  }, 180 * 1000); // each 3-minute time
}

main();
