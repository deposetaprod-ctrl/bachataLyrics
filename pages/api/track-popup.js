import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { item, price } = req.body;

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtppro.zoho.eu',
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_USER,
        pass: process.env.ZOHO_PASSWORD,
      },
    });

    const mailOptions = {
      from: 'Bachata Lyrics <contact@bachatalyrics.com>',
      to: 'Maximilien.godeau.off@gmail.com',
      subject: `🛒 Nouvelle interaction Popup : ${item}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;background:#0f0f13;color:#e2e8f0;border-radius:12px">
          <h2 style="color:#c026d3;margin-top:0">Un utilisateur s'intéresse à la boutique !</h2>
          <p>Quelqu'un a cliqué sur <strong>"Commander"</strong> depuis la popup promotionnelle.</p>
          <hr style="border-color:#2d2d3a;margin:20px 0"/>
          <p><strong>Article affiché :</strong> ${item}</p>
          <p><strong>Prix affiché :</strong> ${price}€</p>
          <p>L'utilisateur a été redirigé vers la boutique.</p>
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
