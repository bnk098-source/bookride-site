const DRIVER_EMAIL = 'bnk098@icloud.com';
const DRIVER_WHATSAPP_PHONE = '33760480229';
const CALLMEBOT_APIKEY = '8593697';

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

async function sendNotificationWhatsapp(session) {
  const m = session.metadata || {};
  const amount = (session.amount_total / 100).toFixed(2);

  const text = [
    '🚗 Nouvelle course payée - ' + amount + ' EUR',
    'Client: ' + (m.customerName || 'Non renseigne'),
    'Tel: ' + (m.customerPhone || 'Non renseigne'),
    'Depart: ' + (m.pickup || 'Non renseigne'),
    'Destination: ' + (m.destination || 'Non renseigne'),
    'Date/heure: ' + (m.datetime || 'Non renseignee'),
    'Vehicule: ' + (m.vehicle === 'van' ? 'Van' : 'Eco')
  ].join('\n');

  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + DRIVER_WHATSAPP_PHONE +
    '&text=' + encodeURIComponent(text) + '&apikey=' + CALLMEBOT_APIKEY;

  await fetch(url);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Méthode non autorisée');
    return;
  }

  const event = req.body;

  if (event && event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      await sendNotificationEmail(session);
    } catch (err) {
      console.error('Erreur envoi email :', err);
    }
    try {
      await sendNotificationWhatsapp(session);
    } catch (err) {
      console.error('Erreur envoi WhatsApp :', err);
    }
  }

  res.status(200).json({ received: true });
};
