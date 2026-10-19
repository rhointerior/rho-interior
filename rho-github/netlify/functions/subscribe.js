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

  // Logo images hosted on Netlify — externally referenced so Gmail renders them
  const BASE = 'https://scintillating-stardust-2f35e7.netlify.app';
  const wordmarkImg = `<img src="${BASE}/rho-email-wordmark.png" width="174" height="86" alt="rho" style="display:block;border:0;">`;
  const logomarkImg = `<img src="${BASE}/rho-email-logomark-parchment.png" width="62" height="83" alt="rho" style="display:block;border:0;">`;

  const confirmationHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>rho interior</title>
</head>
<body style="margin:0;padding:0;background-color:#1A0E08;">

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1A0E08;padding:40px 16px;">
  <tr>
    <td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background-color:#1A0E08;border:1px solid #C87848;">

        <!-- HEADER: wordmark + INTERIOR -->
        <tr>
          <td align="center" style="padding:48px 40px 36px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="padding-bottom:12px;">
                  ${wordmarkImg}
                </td>
              </tr>
              <tr>
                <td align="center">
                  <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:10px;letter-spacing:7px;color:#C87848;text-transform:uppercase;">INTERIOR</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TOP RULE -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background-color:#C87848;">&nbsp;</div>
          </td>
        </tr>

        <!-- BODY COPY -->
        <tr>
          <td style="padding:36px 40px 36px;">
            <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.85;color:#F0E0CC;">Dear ${name},</p>
            <p style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.85;color:#F0E0CC;">Thank you for your interest in <em>rho interior</em>. We are delighted to have you on our list and will be in touch as soon as our website launches.</p>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.85;color:#F0E0CC;">Until then, we look forward to welcoming you into a world of considered design.</p>
          </td>
        </tr>

        <!-- ρ LOGOMARK sign-off -->
        <tr>
          <td align="center" style="padding:0 40px 28px;">
            ${logomarkImg}
          </td>
        </tr>

        <!-- BOTTOM RULE -->
        <tr>
          <td style="padding:0 40px;">
            <div style="height:1px;background-color:#C87848;">&nbsp;</div>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td align="center" style="padding:22px 40px 36px;">
            <p style="margin:0 0 5px;font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:0.5px;color:#C87848;">
              <a href="mailto:design@rhointerior.com" style="color:#C87848;text-decoration:none;">design@rhointerior.com</a>
              &nbsp;&nbsp;·&nbsp;&nbsp;
              <a href="https://rhointerior.com" style="color:#C87848;text-decoration:none;">rhointerior.com</a>
            </p>
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:12px;font-style:italic;color:#8C7B5E;">Lagos &nbsp;·&nbsp; Nigeria</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;

  const internalHtml = `<p>New subscriber: <strong>${name}</strong> &lt;${email}&gt;</p>`;

  // Send confirmation to subscriber
  const confirmResult = await brevoPost('/v3/smtp/email', {
    sender: { name: 'rho interior', email: 'design@rhointerior.com' },
    to: [{ email, name }],
    subject: "You're on the list! 🎉",
    htmlContent: confirmationHtml
  });

  // Send internal notification
  await brevoPost('/v3/smtp/email', {
    sender: { name: 'rho interior form', email: 'design@rhointerior.com' },
    to: [{ email: 'design@rhointerior.com', name: 'rho interior' }],
    subject: `New subscriber: ${name} <${email}>`,
    htmlContent: internalHtml
  });

  // Add to Brevo contact list #2
  await brevoPost('/v3/contacts', {
    email,
    attributes: { FIRSTNAME: name },
    listIds: [2],
    updateEnabled: true
  });

  console.log(`Subscriber saved: ${email}, confirm status: ${confirmResult.status}`);

  return {
    statusCode: 200,
    body: 'ok'
  };
};
