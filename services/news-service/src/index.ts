import fetch from 'node-fetch';

import { NewsAPI, getTopHeadlinesForSingleSource } from '../lib';
import { MapperSourceRequestResponse } from '../../shared/responses/MapperSourceRequestResponse';
import { ISource } from '../../mapper/src/models/db/SourceModel';

const newsApi = new NewsAPI(process.env.NEWS_API_KEY!);

function requestSource() {
  console.log(
    `Requesting source from ${process.env.MAPPER_URL}${process.env.SOURCE_REQUEST_ENDPOINT}`,
  );
  fetch(`${process.env.MAPPER_URL}${process.env.SOURCE_REQUEST_ENDPOINT}`)
    .then((resp) => resp.json())
    .then((mapperResponse: MapperSourceRequestResponse) => {
      console.log(`Response received: 
      ${JSON.stringify(mapperResponse, null, 2)}`);
      if (mapperResponse.updateRequest) {
        fetchSources().then(console.log).catch(console.error);
      } else {
        fetchHeadlines(mapperResponse.source!).then(console.log).catch(console.error);
      }
    })
    .catch(console.error);
}

async function fetchSources() {
  console.log('Fetching sources...');
  const sourceResponse = await newsApi.sources();

  const sourceAmount = sourceResponse.sources.length;
  if (sourceAmount === 0) return;
  console.log('Source fetch successful...');

  console.log(`Sending sources to: ${process.env.MAPPER_URL}${process.env.SOURCE_SET_ENDPOINT}`);
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
  console.log(`Fetching headlines for source ${source.id}: ${source.name}`);
  const headlines = await getTopHeadlinesForSingleSource(newsApi, source);
  console.log('Headlines fetch successful...');

  console.log(`Sending headlines to: ${process.env.MAPPER_URL}${process.env.SOURCE_SET_ENDPOINT}`);
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
  requestSource();
  setInterval(async () => {
    requestSource();
  }, 30 * 1000); // each 3-minute time
}

main();
