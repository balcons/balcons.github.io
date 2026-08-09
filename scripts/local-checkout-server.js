#!/usr/bin/env node
/**
 * Local Stripe checkout API for Jekyll (`jekyll serve` on :4000).
 * Usage:
 *   export STRIPE_SECRET_KEY=sk_test_...
 *   node scripts/local-checkout-server.js
 * Then set shop.checkout_api_url to http://127.0.0.1:4242/create-checkout
 */
const http = require('http');
const { handler } = require('../netlify/functions/create-checkout');

const port = Number(process.env.PORT || 4242);

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    });
    res.end();
    return;
  }

  if (req.url === '/create-checkout' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      const result = await handler({
        httpMethod: 'POST',
        body: body
      });
      res.writeHead(result.statusCode, result.headers);
      res.end(result.body);
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Checkout API on http://127.0.0.1:${port}/create-checkout`);
});
