import React, { useState } from 'react';
import { Grid, Dropdown } from 'semantic-ui-react';
import SearchField from '../components/SearchField';
import TabularMenu from '../components/TabularMenu';
import RedditPosts from '../components/RedditPosts';
import NewsCard from '../components/NewsCard';
import TweetCard from '../components/TweetCard';
import YoutubeCard from '../components/YoutubeCard';

const tabularMenuItems = ['news', 'videos', 'tweets', 'reddit posts'];

const sources = [
  { key: 'abc-news', text: 'ABC News', value: 'abc-news' },
  { key: 'cnn', text: 'CNN', value: 'cnn' },
];

const categories = [
  { key: 'business', text: 'Business', value: 'business' },
  { key: 'entertainment', text: 'Entertainment', value: 'entertainment' },
  { key: 'general', text: 'General', value: 'general' },
  { key: 'health', text: 'Health', value: 'health' },
  { key: 'science', text: 'Science', value: 'science' },
  { key: 'sports', text: 'Sports', value: 'sports' },
  { key: 'technology', text: 'Technology', value: 'technology' },
];

const languages = [
  { key: 'ar', text: 'ARABIC', value: 'ar' },
  { key: 'de', text: 'GERMAN', value: 'de' },
  { key: 'en', text: 'ENGLISH', value: 'en' },
  { key: 'es', text: 'SPANISH', value: 'es' },
  { key: 'fr', text: 'FRENCH', value: 'fr' },
  { key: 'he', text: 'HEBREW', value: 'he' },
  { key: 'it', text: 'ITALIAN', value: 'it' },
  { key: 'nl', text: 'DUTCH', value: 'nl' },
  { key: 'no', text: 'NORWEGIAN', value: 'no' },
  { key: 'pt', text: 'PORTUGUESE', value: 'pt' },
  { key: 'ru', text: 'RUSSIAN', value: 'ru' },
  { key: 'se', text: 'NORTHERN SAMI', value: 'se' },
  { key: 'zh', text: 'CHINESE', value: 'zh' },
];

function Index() {
  const [tabularMenu, setTabularMenu] = useState(tabularMenuItems[0]);
  const handleTabularMenuChange = (name: string) => setTabularMenu(name);

  return (
    <>
      <SearchField />
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
              options={categories}
            />
            <hr />
            <Dropdown
              placeholder='Languages'
              fluid
              multiple
              selection
              options={languages}
            />
            <hr />
            <Dropdown
              placeholder='Sources'
              fluid
              multiple
              selection
              options={sources}
            />
          </Grid.Column>
          <Grid.Column width={10}>
            {tabularMenu === 'news' && <NewsCard />}
            {tabularMenu === 'reddit posts' && <RedditPosts />}
            {tabularMenu === 'tweets' && <TweetCard />}
            {tabularMenu === 'videos' && <YoutubeCard />}
          </Grid.Column>
          <Grid.Column width={3}></Grid.Column>
        </Grid.Row>
      </Grid>
    </>
  );
}

export default Index;
