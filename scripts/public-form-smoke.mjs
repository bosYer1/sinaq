import process from 'node:process';

const BASE_URL = (process.env.TEST_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

function assert(condition, message, context) {
  if (!condition) throw new Error(`${message}${context ? `\nContext: ${JSON.stringify(context, null, 2)}` : ''}`);
}

async function check(path, markers) {
  const response = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
  const html = await response.text();
  assert(response.status === 200, `${path} must return HTTP 200`, { status: response.status });
  assert(/<form\b/i.test(html), `${path} must render a form`);
  for (const marker of markers) assert(html.includes(marker), `${path} is missing required form marker`, { marker });
}

await check('/elaqe', ['name="contact_value"', 'name="website"']);
await check('/klub-sahibi', ['name="contact_value"', 'name="website"']);
console.log('Public form availability smoke: PASS');
