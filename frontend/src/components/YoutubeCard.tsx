import React from 'react';
import PropTypes from 'prop-types';

const YoutubeCard = ({ videoId }: { videoId: string }) => {
  return (
    <iframe
      width='300'
      height='300'
      src={'https://www.youtube.com/embed/' + videoId}
      allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'
    ></iframe>
  );
};

YoutubeCard.propTypes = {
  videoId: PropTypes.string,
};

export default YoutubeCard;
