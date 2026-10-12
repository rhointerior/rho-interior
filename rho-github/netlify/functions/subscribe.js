const https = require('https');

const API_KEY = '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';

function brevoPost(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': API_KEY,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Brevo status:', res.statusCode);
        console.log('Brevo response:', data);
        resolve({ status: res.statusCode, body: data });
      });
    });
    req.on('error', e => {
      console.error('Brevo error:', e.message);
      reject(e);
    });
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  console.log('Function called, method:', event.httpMethod);
  console.log('Body:', event.body);

  const params = new URLSearchParams(event.body);
  const name = params.get('name') || 'Friend';
  const email = params.get('email');

  console.log('Parsed name:', name, 'email:', email);

  if (!email) {
    return { statusCode: 400, body: 'Missing email' };
  }

  try {
    const r1 = await brevoPost({
      sender: { name: 'rho interior', email: 'design@rhointerior.com' },
      to: [{ email, name }],
      subject: "You're on the list",
      htmlContent: '<p>Thank you for signing up.</p>'
    });
    console.log('Confirmation email result:', r1.status, r1.body);

    const r2 = await brevoPost({
      sender: { name: 'rho interior', email: 'design@rhointerior.com' },
      to: [{ email: 'design@rhointerior.com' }],
      subject: 'New sign-up: ' + name,
      htmlContent: '<p>New sign-up: ' + name + ' (' + email + ')</p>'
    });
    console.log('Notification email result:', r2.status, r2.body);
  } catch(e) {
    console.error('Error:', e.message);
  }

  return { statusCode: 200, body: 'ok' };
};
