import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Tous les champs sont requis.' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtppro.zoho.eu',
      port: 465,
      secure: true,
      auth: {
        user: 'maximilien.godeau@maximilien.digital',
        pass: process.env.ZOHO_PASSWORD, // Mot de passe d'application Zoho
      },
    });

    const mailOptions = {
      from: 'Bachata Lyrics <contact@bachatalyrics.com>',
      to: 'Maximilien.godeau.off@gmail.com',
      replyTo: email,
      subject: `💌 Message de ${name} — Bachata Lyrics`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#0f0f13;color:#e2e8f0;border-radius:12px">
          <h2 style="color:#c026d3;margin-top:0">Nouveau message via Bachata Lyrics</h2>
          <p><strong>Nom :</strong> ${name}</p>
          <p><strong>Email :</strong> ${email}</p>
          <hr style="border-color:#2d2d3a;margin:20px 0"/>
          <p style="white-space:pre-wrap">${message}</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('SMTP Error:', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
}

