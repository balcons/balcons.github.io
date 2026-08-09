const Stripe = require('stripe');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return json(500, { error: 'Missing STRIPE_SECRET_KEY on the server.' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Invalid JSON body' });
  }

  const items = Array.isArray(payload.items) ? payload.items : [];
  if (!items.length) {
    return json(400, { error: 'Cart is empty' });
  }

  const currency = (payload.currency || 'eur').toLowerCase();
  const shippingSpain = Number(process.env.SHIPPING_SPAIN_EUR || 7);
  const shippingInternational = Number(process.env.SHIPPING_INTERNATIONAL_EUR || 14);
  const shippingRegion = payload.shippingRegion === 'international' ? 'international' : 'spain';
  const shippingAmount = shippingRegion === 'international' ? shippingInternational : shippingSpain;
  const shippingLabel =
    shippingRegion === 'international' ? 'Shipping (outside Spain)' : 'Shipping (Spain)';

  const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'http://127.0.0.1:4000';
  const successUrl = payload.successUrl || `${siteUrl}/shop/success/`;
  const cancelUrl = payload.cancelUrl || `${siteUrl}/shop/cancel/`;

  const line_items = items.map(function (item) {
    const unitAmount = Math.round(Number(item.price) * 100);
    if (!item.title || !Number.isFinite(unitAmount) || unitAmount < 1) {
      throw new Error('Invalid cart item');
    }
    const images = item.image
      ? [`${siteUrl.replace(/\/$/, '')}/img/portfolio/${item.image}`]
      : [];
    return {
      quantity: Math.max(1, Number(item.quantity) || 1),
      price_data: {
        currency: currency,
        unit_amount: unitAmount,
        product_data: {
          name: `${item.title} (${item.size || 'print'})`,
          images: images,
          metadata: {
            sku: String(item.id || ''),
            size: String(item.size || '')
          }
        }
      }
    };
  });

  line_items.push({
    quantity: 1,
    price_data: {
      currency: currency,
      unit_amount: Math.round(shippingAmount * 100),
      product_data: {
        name: shippingLabel
      }
    }
  });

  try {
    const stripe = Stripe(secret);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: line_items,
      success_url: successUrl,
      cancel_url: cancelUrl,
      shipping_address_collection: {
        allowed_countries: shippingRegion === 'spain'
          ? ['ES']
          : [
              'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'FI', 'FR', 'GB', 'GR',
              'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO',
              'SE', 'SI', 'SK', 'US', 'CA', 'AU', 'NZ', 'JP', 'MX', 'BR', 'AR'
            ]
      },
      metadata: {
        shipping_region: shippingRegion
      }
    });

    return json(200, { id: session.id, url: session.url });
  } catch (err) {
    return json(500, { error: err.message || 'Unable to create checkout session' });
  }
};

function json(statusCode, body) {
  return {
    statusCode: statusCode,
    headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders),
    body: JSON.stringify(body)
  };
}
