import React, { useRef, useEffect } from 'react';
import useScript from '../hooks/useScript';
import PropTypes from 'prop-types';

declare global {
  interface Window {
    twttr: any;
  }
}

const TweetCard = ({ id }: { id: string }) => {
  useScript('./twitter-widgets.js');

  const tweetRef = useRef();
  useEffect(() => {
    if (window.twttr) {
      window.twttr.widgets.createTweet(id, tweetRef.current);
    }
  }, [window.twttr]);

  return <span ref={tweetRef.current}></span>;
};

TweetCard.propTypes = {
  id: PropTypes.string,
};

export default TweetCard;
