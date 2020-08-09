import React from 'react';
import PropTypes from 'prop-types';

const YoutubeCard = ({ videoId }: { videoId: string }) => {
  return (
    <iframe
      style={{ margin: 10, width: 300, height: 300 }}
      src={`https://www.youtube.com/embed/${videoId}`}
      srcDoc={`<style>*{padding:0;margin:0;overflow:hidden}html,body{height:100%}img,span{position:absolute;width:100%;top:0;bottom:0;margin:auto}span{height:1.5em;text-align:center;font:48px/1.5 sans-serif;color:white;text-shadow:0 0 0.5em black}</style><a href=https://www.youtube.com/embed/${videoId}?autoplay=1><img src=https://img.youtube.com/vi/${videoId}/hqdefault.jpg alt='Video'><span>▶</span></a>`}
      frameBorder='0'
      allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture'
      allowFullScreen
    ></iframe>
  );
};

YoutubeCard.propTypes = {
  videoId: PropTypes.string,
};

export default YoutubeCard;
