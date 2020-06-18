import { Router } from 'express';

import * as subscribeController from '../controllers/subscribe-controller';

const route = Router();

route.post('/data-enhance', subscribeController.subscribeForDataEnhancement);
route.post('/data', subscribeController.subscribeForData);

export default route;
