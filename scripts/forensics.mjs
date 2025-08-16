import fetch from 'node-fetch';

const BASE = process.env.BASE || 'https://signal-q.me';
const TOKEN = process.env.API_TOKEN || '';

function log(title, obj){ console.log(`\n=== ${title} ===`); console.dir(obj, {depth: 5}); }

(async () => {
  try {
    const spec = await fetch(`${BASE}/openapi.yaml`, { method: 'GET' });
    log('SPEC HEADERS', Object.fromEntries(spec.headers.entries()));
    const specText = await spec.text();
    console.log('SPEC LENGTH', specText.length);

    const list = await fetch(`${BASE}/actions/list`, {
      headers: { authorization: `Bearer ${TOKEN}` }
    });
    log('LIST STATUS', list.status);
    log('LIST HEADERS', Object.fromEntries(list.headers.entries()));
    console.log('LIST BODY', await list.text());
  } catch (e) {
    console.error('ClientResponseError:', e);
    process.exit(1);
  }
})();
