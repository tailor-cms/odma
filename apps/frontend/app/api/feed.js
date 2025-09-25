import { extractData } from './helpers';
import request from './request';

const urls = {
  root: (topicId) => `/feed/${topicId}`,
  subscribe: (topicId) => `${urls.root(topicId)}/subscribe`,
};

function fetch(topicId) {
  return request.get(urls.root(topicId)).then(extractData);
}

export default {
  urls,
  fetch,
};
