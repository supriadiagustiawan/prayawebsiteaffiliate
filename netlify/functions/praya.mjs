import {getStore} from '@netlify/blobs';
import seed from '../lib/seed.mjs';
import {service} from '../lib/core.mjs';
export default async request=>service({store:getStore({name:'praya-catalog',consistency:'strong'}),seed}).handle(request);
