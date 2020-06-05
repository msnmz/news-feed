import { Router } from 'express';

import * as subscribeController from '../controllers/subscribe-controller';

const route = Router();

route.post('/data-enhance', subscribeController.subscribeForDataEnhancement);

export default route;
