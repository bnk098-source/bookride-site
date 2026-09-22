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
    '<p><strong>Téléphone :</strong> ' + (m.customerPhone ||
