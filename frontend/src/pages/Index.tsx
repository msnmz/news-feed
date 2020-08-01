import React, { useState, useEffect } from 'react';
import { Grid, Dropdown, Message, DropdownProps } from 'semantic-ui-react';
import SearchField from '../components/SearchField';
import TabularMenu from '../components/TabularMenu';
import RedditPosts from '../components/RedditPosts';
import NewsCard from '../components/NewsCard';
import TweetCard from '../components/TweetCard';
import YoutubeCard from '../components/YoutubeCard';
import { ESRedditPost } from '../models/ESRedditPost';
import { ESNews } from '../models/ESNews';
import { ESVideo } from '../models/ESVideo';
import { ESTweet } from '../models/ESTweet';
import { ESBucket, Aggregation } from '../models/ESAggregation';
import {
  ESAggregationRequest,
  search,
  ESData,
  AggregationConstantType,
} from '../api/ElasticService';
import { AggregationConstant } from '../constants/Constants';

const INITIAL_POSTS = {
  items: [],
  categories: [],
  sources: [],
  aggregations: {},
  languages: [],
};

function Index() {
  const [searchValue, setSearchValue] = useState('');
  const [tabularMenuItems, setTabularMenuItems] = useState(['news', 'videos']);
  const [tabularMenu, setTabularMenu] = useState(tabularMenuItems[0]);
  const [news, setNews] = useState<ESData<ESNews>>(INITIAL_POSTS);
  const [videos, setVideos] = useState<ESData<ESVideo>>(INITIAL_POSTS);
  const [redditPosts, setRedditPosts] = useState<ESData<ESRedditPost>>(
    INITIAL_POSTS
  );
  const [tweets, setTweets] = useState<ESData<ESTweet>>(INITIAL_POSTS);
  const [errors, setErrors] = useState({});

  const [selectedAggs, setSelectedAggs] = useState<ESAggregationRequest[]>([]);

  useEffect(() => {
    onSuggestionsSelected(searchValue);
  }, [selectedAggs]);

  useEffect(() => {
    onSuggestionsSelected('');
  }, []);

  const handleTabularMenuChange = (name: string) => setTabularMenu(name);

  const onSuggestionsSelected = (query: string): void => {
    setSearchValue(query);
    search(query, selectedAggs)
      .then(({ tabs, news, videos, redditPosts, tweets }) => {
        setTabularMenuItems([tabs.news, tabs.videos]);
        setNews(news);
        setVideos(videos);
        setRedditPosts(redditPosts);
        setTweets(tweets);
      })
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
    if (tabularMenu.toLowerCase().startsWith('news') && news.dates) {
      return getDate(news.dates);
    } else if (tabularMenu.toLowerCase().startsWith('videos') && videos.dates) {
      return getDate(videos.dates);
    } else if (
      tabularMenu.toLowerCase().startsWith('redditPosts') &&
      redditPosts.dates
    ) {
      return getDate(redditPosts.dates);
    } else if (tabularMenu.toLowerCase().startsWith('tweets') && tweets.dates) {
      return getDate(tweets.dates);
    }
    return [];
  };

  const getAggregations = <K extends AggregationConstantType>(
    aggregation: K
  ): AggregationConstant[] | undefined => {
    const aggParent: string = tabularMenu.toLowerCase().split(' ')[0];
    switch (aggParent) {
      case 'news':
        return news[aggregation];
      case 'videos':
        return videos[aggregation];
      case 'reddit':
        return redditPosts[aggregation];
      case 'tweets':
        return tweets[aggregation];
      default:
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
              options={getAggregations(AggregationConstantType.categories)}
            />
            <hr />
            <Dropdown
              placeholder='Languages'
              fluid
              multiple
              selection
              onChange={aggregationsOnChange.bind(null, 'country')}
              options={getAggregations(AggregationConstantType.languages)}
            />
            <hr />
            <Dropdown
              placeholder='Sources'
              fluid
              multiple
              selection
              onChange={aggregationsOnChange.bind(null, 'source')}
              options={getAggregations(AggregationConstantType.sources)}
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
              news.items.length === 0 && (
                <Message
                  info
                  content='No news found yet! Please make a search!'
                />
              )}
            {tabularMenu.toLowerCase().startsWith('news') &&
              news.items.length > 0 && (
                <NewsCard
                  news={news.items.map((n: ESNews) => ({
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
              tweets.items.length === 0 && (
                <Message
                  info
                  content='No tweets found yet! Please make a search!'
                />
              )}
            {tabularMenu.toLowerCase().startsWith('tweets') &&
              tweets.items.length > 0 &&
              tweets.items.map((tweet: ESTweet, idx: number) => (
                <TweetCard key={tweet.id_str} id={tweet.id_str} />
              ))}
            {tabularMenu.toLowerCase().startsWith('videos') &&
              videos.items.length === 0 && (
                <Message
                  info
                  content='No videos found yet! Please make a search!'
                />
              )}
            {tabularMenu.toLowerCase().startsWith('videos') &&
              videos.items.length > 0 &&
              videos.items.map((video: ESVideo, idx: number) => (
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
