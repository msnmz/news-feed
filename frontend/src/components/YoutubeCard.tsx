import React from 'react';

const YoutubeCard = () => {
  return (
    <div>
      <iframe
        width='300'
        height='300'
        src='https://www.youtube.com/embed/wnDxHTaeNX0'
        allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'
      ></iframe>
    </div>
  );
};

export default YoutubeCard;
