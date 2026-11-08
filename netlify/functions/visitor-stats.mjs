import {getStore} from '@netlify/blobs';
import {aggregate, validateEvent} from '../lib/visitor-data.mjs';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
});

export function createHandler(openStore = getStore) {
return async function handler(request) {
  if (request.method !== 'GET' && request.method !== 'POST') return json({error:'Method not allowed'}, 405);
  try {
    const store = openStore({name:'last-card-visitors', consistency:'strong'});
    if (request.method === 'POST') {
      if (Number(request.headers.get('content-length')) > 4096) return json({error:'Payload too large'}, 413);
      const body = await request.text();
      if (body.length > 4096) return json({error:'Payload too large'}, 413);
      let payload;
      try {payload = JSON.parse(body)} catch {return json({error:'Invalid JSON'}, 400)}
      const event = validateEvent(payload);
      if (!event) return json({error:'Invalid event'}, 400);
      const key = event.type === 'visit' ? `visit/${event.visitId}` : `draw/${event.eventId}`;
      await store.setJSON(key, event, {onlyIfNew:true});
      return json({ok:true});
    }

    const [visits, draws] = await Promise.all([
      store.list({prefix:'visit/'}), store.list({prefix:'draw/'})
    ]);
    const events = [];
    const keys = draws.blobs.map(blob => blob.key);
    for (let start = 0; start < keys.length; start += 40) {
      const page = await Promise.all(keys.slice(start, start + 40).map(key => store.get(key, {type:'json'})));
      events.push(...page.filter(Boolean));
    }
    return json(aggregate(visits.blobs.length, events));
  } catch (error) {
    console.error('Visitor stats failed:', error);
    return json({error:'Statistics temporarily unavailable'}, 503);
  }
}
}

export default createHandler();
