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

function Index() {
  const [searchValue, setSearchValue] = useState('');
  const [tabularMenuItems, setTabularMenuItems] = useState(['news', 'videos']);
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
          setTabularMenuItems([
            `news (${news.hits.total.value})`,
            `videos (${
              videos.aggregations.count?.value || videos.hits.total.value
            })`,
          ]);
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
      text: `starting from ${dt.key_as_string!} (${dt.doc_count})`,
      value: dt.key_as_string!,
    }));
  };

  const getDates = () => {
    if (tabularMenu.toLowerCase().startsWith('news') && newsAgg.dates) {
      return getDate(newsAgg.dates);
    } else if (
      tabularMenu.toLowerCase().startsWith('videos') &&
      videosAgg.dates
    ) {
      return getDate(videosAgg.dates);
    } else if (
      tabularMenu.toLowerCase().startsWith('redditPosts') &&
      redditPostsAgg.dates
    ) {
      return getDate(redditPostsAgg.dates);
    } else if (
      tabularMenu.toLowerCase().startsWith('tweets') &&
      tweetsAgg.dates
    ) {
      return getDate(tweetsAgg.dates);
    }
    return [];
  };

  const getCategoryFilters = () => {
    if (tabularMenu.toLowerCase().startsWith('news') && newsAgg.categories) {
      return categories
        .filter((category) =>
          newsAgg.categories.buckets.find(
            (bucket) => bucket.key === category.key
          )
        )
        .map((category) => {
          const bucket = newsAgg.categories.buckets.find(
            (bucket) => bucket.key === category.key
          );
          if (bucket)
            return {
              ...category,
              text: `${category.text} (${bucket.doc_count})`,
            };
          else return category;
        });
    } else if (
      tabularMenu.toLowerCase().startsWith('videos') &&
      videosAgg.categories
    ) {
      return categories
        .filter((category) =>
          videosAgg.categories.buckets.find(
            (bucket) => bucket.key === category.key
          )
        )
        .map((category) => {
          const bucket = videosAgg.categories.buckets.find(
            (bucket) => bucket.key === category.key
          );
          if (bucket)
            return {
              ...category,
              text: `${category.text} (${bucket.doc_count})`,
            };
          else return category;
        });
    } else {
      return [];
    }
  };

  const getSourceFilters = () => {
    if (tabularMenu.toLowerCase().startsWith('news') && newsAgg.sources) {
      return sources
        .filter((src) =>
          newsAgg.sources.buckets.find((bucket) => bucket.key === src.key)
        )
        .map((src) => {
          const bucket = newsAgg.sources.buckets.find(
            (bucket) => bucket.key === src.key
          );
          if (bucket)
            return {
              ...src,
              text: `${src.text} (${bucket.doc_count})`,
            };
          else return src;
        });
    } else if (
      tabularMenu.toLowerCase().startsWith('videos') &&
      videosAgg.sources
    ) {
      return sources
        .filter((src) =>
          videosAgg.sources.buckets.find((bucket) => bucket.key === src.key)
        )
        .map((src) => {
          const bucket = videosAgg.sources.buckets.find(
            (bucket) => bucket.key === src.key
          );
          if (bucket)
            return {
              ...src,
              text: `${src.text} (${bucket.doc_count})`,
            };
          else return src;
        });
    } else {
      return [];
    }
  };

  const getLanguageFilters = () => {
    console.log({ languages });

    if (tabularMenu.toLowerCase().startsWith('news') && newsAgg.countries) {
      console.log({ buckets: newsAgg.countries.buckets });
      return languages
        .filter((lang) =>
          newsAgg.countries.buckets.find((bucket) => bucket.key === lang.key)
        )
        .map((lang) => {
          const bucket = newsAgg.countries.buckets.find(
            (bucket) => bucket.key === lang.key
          );
          if (bucket)
            return {
              ...lang,
              text: `${lang.text} (${bucket.doc_count})`,
            };
          else return lang;
        });
    } else if (
      tabularMenu.toLowerCase().startsWith('videos') &&
      videosAgg.countries
    ) {
      console.log({ buckets: videosAgg.countries.buckets });
      return languages
        .filter((lang) =>
          videosAgg.countries.buckets.find((bucket) => bucket.key === lang.key)
        )
        .map((lang) => {
          const bucket = videosAgg.countries.buckets.find(
            (bucket) => bucket.key === lang.key
          );
          if (bucket)
            return {
              ...lang,
              text: `${lang.text} (${bucket.doc_count})`,
            };
          else return lang;
        });
    } else {
      return [];
    }
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
              options={getCategoryFilters()}
            />
            <hr />
            <Dropdown
              placeholder='Languages'
              fluid
              multiple
              selection
              onChange={aggregationsOnChange.bind(null, 'country')}
              options={getLanguageFilters()}
            />
            <hr />
            <Dropdown
              placeholder='Sources'
              fluid
              multiple
              selection
              onChange={aggregationsOnChange.bind(null, 'source')}
              options={getSourceFilters()}
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
            {tabularMenu.toLowerCase().startsWith('news') &&
              news.length === 0 && (
                <Message
                  info
                  content='No news found yet! Please make a search!'
                />
              )}
            {tabularMenu.toLowerCase().startsWith('news') && news.length > 0 && (
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
            {tabularMenu.toLowerCase().startsWith('tweets') &&
              tweets.length === 0 && (
                <Message
                  info
                  content='No tweets found yet! Please make a search!'
                />
              )}
            {tabularMenu.toLowerCase().startsWith('tweets') &&
              tweets.length > 0 &&
              tweets.map((tweet: ESTweet, idx: number) => (
                <TweetCard key={tweet.id_str} id={tweet.id_str} />
              ))}
            {tabularMenu.toLowerCase().startsWith('videos') &&
              videos.length === 0 && (
                <Message
                  info
                  content='No videos found yet! Please make a search!'
                />
              )}
            {tabularMenu.toLowerCase().startsWith('videos') &&
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
