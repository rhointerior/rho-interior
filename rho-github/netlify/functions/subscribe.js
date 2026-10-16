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

  const confirmationHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark only"><meta name="supported-color-schemes" content="dark only"></head>
<body bgcolor="#1A0E08" style="margin:0;padding:0;background-color:#1A0E08;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#1A0E08" style="background-color:#1A0E08;">
<tr><td align="center" bgcolor="#1A0E08" style="background-color:#1A0E08;padding:40px 16px;">
  <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" bgcolor="#1A0E08" style="width:100%;max-width:560px;background-color:#1A0E08;border:1px solid #C87848;">
    <tr><td align="center" bgcolor="#1A0E08" style="background-color:#1A0E08;padding:36px 36px 4px;">
      <img src="https://rhointerior.com/rho-email-logo-name.png" width="130" alt="rho interior" style="display:block;border:0;margin:0 auto;" />
      <div style="font-family:Georgia,serif;font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9B9A5;margin-top:8px;padding-left:6px;">interior</div>
    </td></tr>
    <tr><td bgcolor="#1A0E08" style="background-color:#1A0E08;padding:24px 36px 0;"><div style="border-top:1px solid #C87848;font-size:0;line-height:0;">&nbsp;</div></td></tr>
    <tr><td bgcolor="#1A0E08" style="background-color:#1A0E08;padding:28px 40px 0;">
      <p style="font-family:Georgia,serif;font-size:15px;color:#F0E0CC;line-height:1.8;margin:0 0 16px;">Dear ${safeName},</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#F0E0CC;line-height:1.8;margin:0 0 16px;">Thank you for your interest in <em>rho interior</em>. We are delighted to have you on our list and will be in touch as soon as our website launches.</p>
      <p style="font-family:Georgia,serif;font-size:15px;color:#F0E0CC;line-height:1.8;margin:0;">Until then, we look forward to welcoming you into a world of considered design.</p>
    </td></tr>
    <tr><td align="center" bgcolor="#1A0E08" style="background-color:#1A0E08;padding:36px 36px 0;">
      <img src="https://rhointerior.com/rho-email-logomark.png" width="44" alt="rho" style="display:block;border:0;margin:0 auto;" />
    </td></tr>
    <tr><td bgcolor="#1A0E08" style="background-color:#1A0E08;padding:24px 36px 0;"><div style="border-top:1px solid #C87848;font-size:0;line-height:0;">&nbsp;</div></td></tr>
    <tr><td align="center" bgcolor="#1A0E08" style="background-color:#1A0E08;padding:20px 36px 36px;font-family:Georgia,serif;font-size:12px;letter-spacing:1px;color:#F0E0CC;">
      <a href="mailto:design@rhointerior.com" style="color:#C87848;text-decoration:none;">design@rhointerior.com</a>
      <span style="color:#C87848;"> &nbsp;&middot;&nbsp; </span>
      <a href="https://rhointerior.com" style="color:#C87848;text-decoration:none;">rhointerior.com</a>
      <div style="margin-top:8px;font-style:italic;color:#C9B9A5;">Lagos &middot; Nigeria</div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

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
