import {getStore} from '@netlify/blobs';
import seed from '../lib/seed.mjs';
import {service,json} from '../lib/core.mjs';
export default async()=>{try{return json(await service({store:getStore({name:'praya-catalog',consistency:'strong'}),seed}).sync())}catch{return json({error:'Pembaruan belum tersimpan; akan dicoba pada jadwal berikutnya'},503)}};
export const config={schedule:'0 */6 * * *'};
