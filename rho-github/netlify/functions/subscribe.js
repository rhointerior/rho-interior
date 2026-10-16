const https = require('https');

const API_KEY = process.env.BREVO_API_KEY;

function brevoPost(path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: 'api.brevo.com',
      path,
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

  const esc = v => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const safeName = esc(name);

  const confirmationHtml = `<div style="background:#1A0E08;padding:40px 16px;font-family:'Cormorant Garamond',Georgia,serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#1A0E08;border:1px solid #C87848;">
    <tr><td style="padding:44px 36px 8px;text-align:center;">
      <img src="https://rhointerior.com/rho-email-logo-name.png" width="200" alt="rho interior" style="display:inline-block;border:0;" />
      <div style="font-size:10px;letter-spacing:6px;text-transform:uppercase;color:#F0E0CC;opacity:.7;margin-top:12px;padding-left:6px;">interior</div>
    </td></tr>
    <tr><td style="padding:24px 36px 0;"><div style="border-top:1px solid #C87848;"></div></td></tr>
    <tr><td style="padding:28px 40px 0;">
      <p style="font-family:Georgia,serif;font-size:15px;color:#F0E0CC;line-height:1.8;margin:0 0 16px;">Dear ${safeName},</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#F0E0CC;line-height:1.8;margin:0 0 16px;">Thank you for your interest in <em>rho interior</em>. We are delighted to have you on our list and will be in touch as soon as our website launches.</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#F0E0CC;line-height:1.8;margin:0;">Until then, we look forward to welcoming you into a world of considered design.</p>
    </td></tr>
    <tr><td style="padding:36px 36px 0;text-align:center;">
      <img src="https://rhointerior.com/rho-email-logomark.png" width="44" alt="rho" style="display:inline-block;border:0;" />
    </td></tr>
    <tr><td style="padding:24px 36px 0;"><div style="border-top:1px solid #C87848;"></div></td></tr>
    <tr><td style="padding:20px 36px 36px;text-align:center;font-family:Georgia,serif;font-size:12px;letter-spacing:1px;color:#F0E0CC;">
      <a href="mailto:design@rhointerior.com" style="color:#C87848;text-decoration:none;">design@rhointerior.com</a>
      <span style="color:#C87848;"> &nbsp;·&nbsp; </span>
      <a href="https://rhointerior.com" style="color:#C87848;text-decoration:none;">rhointerior.com</a>
      <div style="margin-top:8px;font-style:italic;color:#F0E0CC;opacity:.7;">Lagos · Nigeria</div>
    </td></tr>
  </table>
</div>`;

  await brevoPost('/v3/smtp/email', {
    sender: { name: 'rho interior', email: 'design@rhointerior.com' },
    to: [{ email, name }],
    subject: "You're on the list! 🎉",
    htmlContent: confirmationHtml
  });

  await brevoPost('/v3/smtp/email', {
    sender: { name: 'rho interior', email: 'design@rhointerior.com' },
    to: [{ email: 'design@rhointerior.com' }],
    subject: 'New sign-up: ' + name,
    htmlContent: '<p>New sign-up: <strong>' + safeName + '</strong> (' + esc(email) + ')</p>'
  });

  await brevoPost('/v3/contacts', {
    email,
    attributes: { FIRSTNAME: name },
    listIds: [2],
    updateEnabled: true
  });

  return { statusCode: 200, body: 'ok' };
};
