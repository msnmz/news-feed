import { Router } from 'express';

import * as subscribeController from '../controllers/subscribe-controller';

const route = Router();

route.post('/subscribe', subscribeController.subscribe);

export default route;
