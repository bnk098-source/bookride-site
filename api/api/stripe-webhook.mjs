import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const DRIVER_EMAIL = 'bnk098@icloud.com';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function sendNotificationEmail(session) {
  const m = session.metadata || {};
  const amount = (session.amount_total / 100).toFixed(2);

  const html = [
    '<h2>Nouvelle course payée en ligne — BookRide</h2>',
    '<p><strong>Montant payé :</strong> ' + amount + ' €</p>',
    '<p><strong>Client :</strong> ' + (m.customerName || 'Non renseigné') + '</p>',
    '<p><strong>Téléphone :</strong> ' + (m.customerPhone || 'Non renseigné') + '</p>',
    '<p><strong>Départ :</strong> ' + (m.pickup || 'Non renseigné') + '</p>',
    '<p><strong>Destination :</strong> ' + (m.destination || 'Non renseigné') + '</p>',
    '<p><strong>Date/heure souhaitée :</strong> ' + (m.datetime || 'Non renseignée') + '</p>',
    '<p><strong>Véhicule :</strong> ' + (m.vehicle === 'van' ? 'Van' : 'Eco') + '</p>',
  ].join('\n');

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'BookRide <onboarding@resend.dev>',
      to: [DRIVER_EMAIL],
      subject: '🚗 Nouvelle réservation payée — ' + amount + ' €',
      html: html,
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).send('Méthode non autorisée');
    return;
  }

  const rawBody = await buffer(req);
  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    res.status(400).send('Signature invalide : ' + err.message);
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      await sendNotificationEmail(session);
    } catch (err) {
      console.error('Erreur envoi email :', err);
    }
  }

  res.status(200).json({ received: true });
}
