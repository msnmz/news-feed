import React from 'react';
import useScript from '../hooks/useScript';

const RedditPosts = () => {
  useScript('http://embed.redditmedia.com/widgets/platform.js');

  return (
    <div>
      <blockquote className='reddit-card' data-card-created='1490648549'>
        <a href='https://www.reddit.com/r/AutoNewspaper/comments/gxjmki/world_plane_crashes_in_rural_georgia_2_children/?ref=share&ref_source=embed'>
          [World] - Plane crashes in rural Georgia; 2 children among the 5 dead
          | Hindustan Times
        </a>{' '}
        from <a href='http://www.reddit.com/r/worldnews'>AutoNewspaper</a>
      </blockquote>
    </div>
  );
};

export default RedditPosts;
