import { Router } from 'express';

import * as newsController from '../controllers/news-controller';

const route = Router();

route.get('/request-source', newsController.requestSource);
route.post('/sources', newsController.setRenewSources);
route.post('/headlines', newsController.createAndPublishHeadlines);
route.post('/enhance-headlines', newsController.updateHeadlinesWithEnhancedData);

export default route;
