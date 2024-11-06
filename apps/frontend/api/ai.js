import { extractData } from './helpers';
import request from './request';

const urls = {
  root: () => '/ai',
};

function prompt(payload) {
  return request.post(urls.root(), payload).then(extractData);
}

export default {
  prompt,
};
