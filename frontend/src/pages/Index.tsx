import React, { useState, useEffect } from 'react';
import { Grid, Dropdown, Message, DropdownProps } from 'semantic-ui-react';
import SearchField from '../components/SearchField';
import TabularMenu from '../components/TabularMenu';
import RedditPosts from '../components/RedditPosts';
import NewsCard from '../components/NewsCard';
import TweetCard from '../components/TweetCard';
import YoutubeCard from '../components/YoutubeCard';
import {
  ESNewsResult,
  ESVideosResult,
  ESTweetResult,
  ESHit,
  ESInnerHit,
  ESRedditResult,
} from '../models/ESResult';
import { ESRedditPost } from '../models/ESRedditPost';
import { ESNews } from '../models/ESNews';
import { ESVideo } from '../models/ESVideo';
import { ESTweet } from '../models/ESTweet';
import { ESAggregations, ESBucket, Aggregation } from '../models/ESAggregation';
import { sources } from '../constants/Sources';
import { categories } from '../constants/Categories';
import { languages } from '../constants/Languages';
import { values } from 'lodash';

const tabularMenuItems = ['news', 'videos'];

function Index() {
  const [searchValue, setSearchValue] = useState('');
  const [tabularMenu, setTabularMenu] = useState(tabularMenuItems[0]);
  const [news, setNews] = useState([] as ESNews[]);
  const [newsAgg, setNewsAgg] = useState({} as ESAggregations);
  const [videos, setVideos] = useState([] as ESVideo[]);
  const [videosAgg, setVideosAgg] = useState({} as ESAggregations);
  const [redditPosts, setRedditPosts] = useState([] as ESRedditPost[]);
  const [redditPostsAgg, setRedditPostsAgg] = useState({} as ESAggregations);
  const [tweets, setTweets] = useState([] as ESTweet[]);
  const [tweetsAgg, setTweetsAgg] = useState({} as ESAggregations);
  const [errors, setErrors] = useState({});

  const [selectedAggs, setSelectedAggs] = useState(
    [] as { type: string; path: string; values: string[] }[]
  );

  useEffect(() => {
    onSuggestionsSelected(searchValue);
  }, [selectedAggs]);

  useEffect(() => {
    onSuggestionsSelected('');
  }, []);

  const handleTabularMenuChange = (name: string) => setTabularMenu(name);

  const onSuggestionsSelected = (search: string): void => {
    setSearchValue(search);
    fetch(
      `${process.env.REACT_APP_ELASTIC_SERVICE_URL}/search?search=${search}`,
      {
        method: 'POST',
        body: JSON.stringify({ aggs: selectedAggs }),
        headers: {
          'Content-type': 'application/json',
        },
      }
    )
      .then((resp) => resp.json())
      .then(
        ({
          news,
          videos,
          redditPosts,
          tweets,
        }: {
          news: { hits: ESNewsResult; aggregations: ESAggregations };
          videos: { hits: ESVideosResult; aggregations: ESAggregations };
          redditPosts: { hits: ESRedditResult; aggregations: ESAggregations };
          tweets: { hits: ESTweetResult; aggregations: ESAggregations };
        }) => {
          setNews(
            news.hits.hits.map((hit: ESHit<ESNews>) => ({
              ...hit._source,
              id: hit._id,
            }))
          );
          setNewsAgg(news.aggregations);
          setVideos(
            videos.hits.hits.flatMap((hit: ESInnerHit<ESHit<ESVideo>>) =>
              hit.inner_hits.results.hits.hits.map(
                (innerHit: ESHit<ESVideo>) => innerHit._source
              )
            )
          );
          setVideosAgg(videos.aggregations);
          setRedditPosts(
            redditPosts.hits.hits.flatMap(
              (hit: ESInnerHit<ESHit<ESRedditPost>>) =>
                hit.inner_hits.results.hits.hits.map(
                  (innerHit: ESHit<ESRedditPost>) => innerHit._source
                )
            )
          );
          setRedditPostsAgg(redditPosts.aggregations);
          setTweets(
            tweets.hits.hits.flatMap((hit: ESInnerHit<ESHit<ESTweet>>) =>
              hit.inner_hits.results.hits.hits.map(
                (innerHit: ESHit<ESTweet>) => innerHit._source
              )
            )
          );
          setTweetsAgg(tweets.aggregations);
        }
      )
      .catch((error: Error) => {
        setErrors(error.message);
        console.log({ error });
      });
  };

  const aggregationsOnChange = (
    name: string,
    event: React.SyntheticEvent<HTMLElement, Event>,
    data: DropdownProps
  ) => {
    setSelectedAggs((prevAggs) => {
      const existing = prevAggs.find((aggs) => aggs.path === name);
      let values: string[] = data.value as string[];

      if (existing) {
        if (values.length > 0) {
          return prevAggs.map((aggs) =>
            aggs.path === name ? { ...aggs, values } : aggs
          );
        } else {
          return prevAggs.filter((aggs) => aggs.path !== name);
        }
      } else {
        return [...prevAggs, { path: name, type: 'terms', values }];
      }
    });
  };

  const getDate = (dates: Aggregation<ESBucket<string>>) => {
    return dates.buckets.map((dt) => ({
      key: dt.key_as_string!,
      text: `starting from ${dt.key_as_string!}`,
      value: dt.key_as_string!,
    }));
  };

  const getDates = () => {
    if (tabularMenu === 'news' && newsAgg.dates) {
      return getDate(newsAgg.dates);
    } else if (tabularMenu === 'videos' && videosAgg.dates) {
      return getDate(videosAgg.dates);
    } else if (tabularMenu === 'redditPosts' && redditPostsAgg.dates) {
      return getDate(redditPostsAgg.dates);
    } else if (tabularMenu === 'tweets' && tweetsAgg.dates) {
      return getDate(tweetsAgg.dates);
    }
    return [];
  };

  return (
    <>
      <SearchField onSuggestionSelected={onSuggestionsSelected} />
      <Grid>
        <Grid.Row>
          <Grid.Column width={3}></Grid.Column>
          <Grid.Column width={13}>
            <TabularMenu
              items={tabularMenuItems}
              onMenuItemSelected={handleTabularMenuChange}
            />
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column width={3}>
            <Dropdown
              placeholder='Categories'
              fluid
              multiple
              selection
              onChange={aggregationsOnChange.bind(null, 'category')}
              options={categories.filter((category) => {
                if (tabularMenu === 'news' && newsAgg.categories) {
                  return newsAgg.categories.buckets.find(
                    (bucket) => bucket.key === category.key
                  );
                } else if (tabularMenu === 'videos' && videosAgg.categories) {
                  return videosAgg.categories.buckets.find(
                    (bucket) => bucket.key === category.key
                  );
                }
                return true;
              })}
            />
            <hr />
            <Dropdown
              placeholder='Languages'
              fluid
              multiple
              selection
              onChange={aggregationsOnChange.bind(null, 'country')}
              options={languages.filter((lang) => {
                if (tabularMenu === 'news' && newsAgg.countries) {
                  return newsAgg.countries.buckets.find(
                    (bucket) => bucket.key === lang.key
                  );
                } else if (tabularMenu === 'videos' && videosAgg.countries) {
                  return videosAgg.countries.buckets.find(
                    (bucket) => bucket.key === lang.key
                  );
                }
                return true;
              })}
            />
            <hr />
            <Dropdown
              placeholder='Sources'
              fluid
              multiple
              selection
              onChange={aggregationsOnChange.bind(null, 'source')}
              options={sources.filter((src) => {
                if (tabularMenu === 'news' && newsAgg.sources) {
                  return newsAgg.sources.buckets.find(
                    (bucket) => bucket.key === src.key
                  );
                } else if (tabularMenu === 'videos' && videosAgg.sources) {
                  return videosAgg.sources.buckets.find(
                    (bucket) => bucket.key === src.key
                  );
                }
                return true;
              })}
            />
            <hr />
            <Dropdown
              placeholder='Dates'
              fluid
              multiple
              selection
              onChange={aggregationsOnChange.bind(null, 'date')}
              options={getDates()}
            />
          </Grid.Column>
          <Grid.Column width={10}>
            {tabularMenu === 'news' && news.length === 0 && (
              <Message
                info
                content='No news found yet! Please make a search!'
              />
            )}
            {tabularMenu === 'news' && news.length > 0 && (
              <NewsCard
                news={news.map((n: ESNews) => ({
                  image: n.urlToImage ? n.urlToImage! : './logo512.png',
                  header: n.title ? n.title! : 'News',
                  meta: n.author ? n.author! : n.source.name!,
                  description: n.description
                    ? n.description!
                    : 'No description found...',
                  key: n.id,
                }))}
              />
            )}
            {tabularMenu === 'tweets' && tweets.length === 0 && (
              <Message
                info
                content='No tweets found yet! Please make a search!'
              />
            )}
            {tabularMenu === 'tweets' &&
              tweets.length > 0 &&
              tweets.map((tweet: ESTweet, idx: number) => (
                <TweetCard key={tweet.id_str} id={tweet.id_str} />
              ))}
            {tabularMenu === 'videos' && videos.length === 0 && (
              <Message
                info
                content='No videos found yet! Please make a search!'
              />
            )}
            {tabularMenu === 'videos' &&
              videos.length > 0 &&
              videos.map((video: ESVideo, idx: number) => (
                <YoutubeCard
                  key={video.title! + idx}
                  videoId={video.youtubeId.videoId!}
                />
              ))}
          </Grid.Column>
          <Grid.Column width={3}></Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
}

export default Index;
