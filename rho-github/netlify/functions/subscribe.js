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
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', e => reject(e));
    req.write(body);
    req.end();
  });
}

exports.handler = async (event) => {
  const params = new URLSearchParams(event.body);
  const name = params.get('name') || 'Friend';
  const email = params.get('email');

  if (!email) return { statusCode: 400, body: 'Missing email' };

  const confirmationHtml = `<div style="background:#F4EFE6;padding:40px 20px;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;background:#F4EFE6;">
    <div style="border:1px solid #C8A860;padding:32px 36px;">
      <div style="text-align:center;border:1px solid #C8A860;padding:16px;margin-bottom:28px;">
        <img src="https://rhointerior.com/rho-final.png" width="44" height="63" alt="rho interior" style="display:inline-block;" />
      </div>
      <div style="border-top:1px solid #C8A860;margin-bottom:24px;"></div>
      <p style="font-size:15px;color:#2C2C2C;line-height:1.7;margin:0 0 16px;">Dear ${name},</p>
      <p style="font-size:15px;color:#2C2C2C;line-height:1.7;margin:0 0 16px;">Thank you for your interest in <em>rho interior</em>. We are delighted to have you on our list and will be in touch as soon as our website launches.</p>
      <p style="font-size:15px;color:#2C2C2C;line-height:1.7;margin:0 0 24px;">Until then, we look forward to welcoming you into a world of considered design.</p>
      <div style="border-top:1px solid #C8A860;margin-bottom:24px;"></div>
      <p style="font-size:13px;color:#8C7B5E;margin:0;text-align:center;font-style:italic;">rho interior</p>
    </div>
  </div>
</div>`;

  await brevoPost({
    sender: { name: 'rho interior', email: 'design@rhointerior.com' },
    to: [{ email, name }],
    subject: "You're on the list",
    htmlContent: confirmationHtml
  });

  await brevoPost({
    sender: { name: 'rho interior', email: 'design@rhointerior.com' },
    to: [{ email: 'design@rhointerior.com' }],
    subject: 'New sign-up: ' + name,
    htmlContent: '<p>New sign-up: <strong>' + name + '</strong> (' + email + ')</p>'
  });

  return { statusCode: 200, body: 'ok' };
};
