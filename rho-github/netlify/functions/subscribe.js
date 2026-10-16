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

  // Wordmark PNG (base64)
  const wordmarkSVG = `<img src="data:image/png;base64,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0bho2ZN+jodGVPUkE65/Cw7Xv41g/la8+sXLdgK4KtX91I3A8D9D8REATS97kOBrqa7EaW6u5uP1xy/dYfXcqe6nGkWHP5YFroEiesi3dwL4uSN6T/3C+LpKvMNQ6Up6b9pP2rV6WtqpvyroceRDFHujzfHvBD2OYu15PhF1Ivhw0OPIi+quWHPbDyxLpro7Lge0xbKm37JO5MdzF5xa4MbG5UlVZW/3phUquctV5a0Amsd8u09V74hk3W+PNsaC6vcnO5arg/dB8W4A9aPfygDoVNX/chQPNbTEEyLiFfenoWKEpsERER1OX9emZjjZs0XlTEBPBuQkADOhWK2CR1SwoWbYeXa8hte/PTFXD+giFVkmDlZ4igtlpKk9C+BZBTpVsGHAGe7gLMjywgZHRFVnV+8Tx9TmvIU5zR3hiByjigZxpA7QPaoyTdXLOo7koGhQQQaK3Z7IS66HnZmI2xu2T71ERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERFRZ/j9PRPyW+ns2RQAAAABJRU5ErkJggg==" width="220" height="139" alt="rho" style="display:block;border:0;">`;

  // Logomark PNG (base64)
  const logomarkSVG = `<img src="data:image/png;base64,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" width="62" height="83" alt="rho-logomark" style="display:block;border:0;">`;

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
                <td align="center" style="padding-bottom:8px;">
                  ${wordmarkSVG}
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
            ${logomarkSVG}
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
