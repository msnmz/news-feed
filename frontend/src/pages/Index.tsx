import React, { useState, useEffect, SyntheticEvent } from 'react';
import {
  Grid,
  Dropdown,
  Message,
  DropdownProps,
  Header,
  Image,
  Modal,
  Pagination,
  PaginationProps,
} from 'semantic-ui-react';
import SearchField from '../components/SearchField';
import TabularMenu from '../components/TabularMenu';
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
  searchPaginatedNews,
  searchPaginated,
} from '../api/ElasticService';
import { AggregationConstant } from '../constants/Constants';
import moment from 'moment';
import RedditPosts from '../components/RedditPosts';
import useScript from '../hooks/useScript';

const ITEM_PER_PAGE = 12;

const INITIAL_POSTS = {
  total: 0,
  items: [],
  categories: [],
  sources: [],
  aggregations: {},
  languages: [],
};

const INITIAL_PAGING = {
  active: 1,
  total: 1,
};

function Index() {
  const [open, setOpen] = React.useState(false);
  const [modalNews, setModalNews] = React.useState<ESNews | null>(null);

  const [searchValue, setSearchValue] = useState('');
  const [tabularMenuItems, setTabularMenuItems] = useState(['news', 'videos']);
  const [paging, setPaging] = useState({
    news: INITIAL_PAGING,
    videos: INITIAL_PAGING,
    redditPosts: INITIAL_PAGING,
    tweets: INITIAL_PAGING,
  });
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
        setPaging({
          news: { active: 1, total: Math.ceil(news.total / ITEM_PER_PAGE) },
          videos: { active: 1, total: Math.ceil(videos.total / ITEM_PER_PAGE) },
          redditPosts: {
            active: 1,
            total: Math.ceil(redditPosts.total / ITEM_PER_PAGE),
          },
          tweets: { active: 1, total: Math.ceil(tweets.total / ITEM_PER_PAGE) },
        });
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
      text: `week ${moment(dt.key_as_string!, 'DD-MM-YYYY').week()} (${
        dt.doc_count
      })`,
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

  const onSearchPaginated = (
    subject: 'news' | 'redditPosts' | 'videos' | 'tweets'
  ) => (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    data: PaginationProps
  ) => {
    const activePage =
      data.activePage !== undefined ? Number.parseInt(data.activePage + '') : 1;
    const offset = (activePage - 1) * ITEM_PER_PAGE;
    if (subject === 'news') {
      searchPaginatedNews(searchValue, selectedAggs, {
        size: ITEM_PER_PAGE,
        from: offset,
      })
        .then((response) => {
          setNews(response.news);
          setPaging((prev) => ({
            ...prev,
            news: { ...prev.news, active: activePage },
          }));
        })
        .catch((error: Error) => {
          setErrors(error.message);
          console.log({ error });
        });
    } else {
      searchPaginated(subject, searchValue, selectedAggs, {
        size: ITEM_PER_PAGE,
        from: offset,
      })
        .then((response) => {
          if (subject === 'videos')
            setVideos(response.subject as ESData<ESVideo>);
          else if (subject === 'redditPosts')
            setRedditPosts(response.subject as ESData<ESRedditPost>);
          else setTweets(response.subject as ESData<ESTweet>);

          setPaging((prev) => ({
            ...prev,
            [subject]: { ...prev[subject], active: activePage },
          }));
        })
        .catch((error: Error) => {
          setErrors(error.message);
          console.log({ error });
        });
    }
  };

  return (
    <>
      <SearchField onSuggestionSelected={onSuggestionsSelected} />
      <Grid>
        <Grid.Row>
          <Grid.Column computer={4} tablet={8} mobile={16}></Grid.Column>
          <Grid.Column computer={12} tablet={8} mobile={16}>
            <TabularMenu
              items={tabularMenuItems}
              onMenuItemSelected={handleTabularMenuChange}
            />
          </Grid.Column>
        </Grid.Row>

        <Grid.Row>
          <Grid.Column computer={4} tablet={8} mobile={16}>
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
              onChange={aggregationsOnChange.bind(null, 'language')}
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
            <br />
            <br />
          </Grid.Column>
          <Grid.Column computer={12} tablet={8} mobile={16}>
            {tabularMenu.toLowerCase().startsWith('news') &&
              news.items.length === 0 && (
                <Message
                  info
                  content='No news found yet! Please make a search!'
                />
              )}
            {tabularMenu.toLowerCase().startsWith('news') &&
              news.items.length > 0 && (
                <>
                  <NewsCard
                    news={news.items.map((n: ESNews) => ({
                      data: n,
                      image: n.urlToImage ? n.urlToImage! : './logo512.png',
                      header: n.title ? n.title! : 'News',
                      meta: n.author ? n.author! : n.source.name!,
                      description: n.description
                        ? n.description!
                        : 'No description found...',
                      key: n.id,
                      onClick: (
                        event: SyntheticEvent,
                        data: { data: ESNews }
                      ) => {
                        setModalNews(data.data);
                        setOpen(true);
                      },
                    }))}
                  />
                  <Pagination
                    activePage={paging.news.active}
                    totalPages={paging.news.total}
                    onPageChange={onSearchPaginated('news')}
                  />
                </>
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
                <TweetCard id={tweet.id_str} key={tweet.id_str} />
              ))}
            {tabularMenu.toLowerCase().startsWith('videos') &&
              videos.items.length === 0 && (
                <Message
                  info
                  content='No videos found yet! Please make a search!'
                />
              )}
            {tabularMenu.toLowerCase().startsWith('videos') &&
              videos.items.length > 0 && (
                <>
                  {videos.items.map((video: ESVideo, idx: number) => (
                    <YoutubeCard
                      key={video.title! + idx}
                      videoId={video.youtubeId.videoId!}
                    />
                  ))}
                  <Pagination
                    activePage={paging.videos.active}
                    totalPages={paging.videos.total}
                    onPageChange={onSearchPaginated('videos')}
                  />
                </>
              )}
            {tabularMenu.toLowerCase().startsWith('reddit') &&
              redditPosts.items.length === 0 && (
                <Message
                  info
                  content='No Reddit posts found yet! Please make a search!'
                />
              )}
            {tabularMenu.toLowerCase().startsWith('reddit') &&
              redditPosts.items.length > 0 &&
              redditPosts.items.map((post: ESRedditPost, idx: number) => (
                <RedditPosts
                  key={post.title! + idx}
                  permalink={post.permalink!}
                  subreddit={post.subreddit!}
                  title={post.title!}
                  author={post.author!}
                />
              ))}
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Modal
        onClose={() => setOpen(false)}
        onOpen={() => setOpen(true)}
        open={open}
      >
        <Modal.Header>{modalNews?.title}</Modal.Header>
        <Modal.Content image>
          <Image size='medium' src={modalNews?.urlToImage} wrapped />
          <Modal.Description>
            <Header>{modalNews?.author}</Header>
            <p>
              {modalNews?.content?.substring(
                0,
                modalNews?.content.lastIndexOf('[')
              )}
            </p>
            <a href={modalNews?.url}>To read more...</a>
          </Modal.Description>
        </Modal.Content>
      </Modal>
    </>
  );
}

export default Index;
