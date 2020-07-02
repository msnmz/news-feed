import React from 'react';
import useScript from '../hooks/useScript';
import PropTypes from 'prop-types';

const RedditPosts = ({
  permalink,
  subreddit,
  title,
  author,
}: {
  permalink: string;
  subreddit: string;
  title: string;
  author: string;
}) => {
  useScript('./reddit-platform.js', { 'data-height': '100' });

  return (
    <blockquote
      className='reddit-card'
      data-card-created='1490648549'
      data-height='300'
    >
      <a
        href={
          'http://www.reddit.com' + permalink + '?ref=share&ref_source=embed'
        }
      >
        {title}
      </a>{' '}
      from {author}
    </blockquote>
  );
};

RedditPosts.propTypes = {
  permalink: PropTypes.string,
  subreddit: PropTypes.string,
  title: PropTypes.string,
  author: PropTypes.string,
};

export default RedditPosts;
