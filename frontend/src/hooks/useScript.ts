import { useEffect } from 'react';

const useScript = (url: string, attributes: { [key: string]: any } = {}) => {
  useEffect(() => {
    const script = document.createElement('script');

    script.src = url;
    script.async = false;
    Object.entries(attributes).forEach(([key, attr]) => {
      script.setAttribute(key, attr);
    });

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [url]);
};

export default useScript;
