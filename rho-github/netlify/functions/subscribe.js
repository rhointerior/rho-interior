const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  const params = new URLSearchParams(event.body);
  const name = params.get('name') || 'Friend';
  const email = params.get('email');

  if (!email) return { statusCode: 400, body: 'Missing email' };

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: {
      user: process.env.BREVO_SMTP_USER,
      pass: process.env.BREVO_SMTP_KEY
    }
  });

  const confirmationHtml = `<div style="background:#F4EFE6;padding:40px 20px;font-family:Georgia,serif;color-scheme:light;">
  <div style="max-width:560px;margin:0 auto;background:#F4EFE6;">
    <div style="border:1px solid #C8A860;padding:32px 36px;">
      <div style="text-align:center;border:1px solid #C8A860;padding:16px;margin-bottom:28px;">
        <img src="https://rhointerior.com/rho-mark.png" width="40" height="48" alt="rho" style="display:inline-block;width:40px;height:48px;" />
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

  await transporter.sendMail({
    from: '"rho interior" <design@rhointerior.com>',
    to: email,
    subject: "You're on the list",
    html: confirmationHtml
  });

  await transporter.sendMail({
    from: '"rho interior" <design@rhointerior.com>',
    to: 'design@rhointerior.com',
    subject: 'New sign-up: ' + name,
    html: '<p>New sign-up: <strong>' + name + '</strong> (' + email + ')</p>'
  });

  return { statusCode: 200, body: 'ok' };
};
