const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }

  try {
    const { amount, customerName, customerPhone, pickup, destination, datetime, vehicle } = req.body;

    if (!amount || isNaN(amount) || Number(amount) < 1) {
      res.status(400).json({ error: 'Montant invalide' });
      return;
    }

    const description = [
      customerName ? ('Client : ' + customerName) : null,
      customerPhone ? ('Tél : ' + customerPhone) : null,
      pickup ? ('Départ : ' + pickup) : null,
      destination ? ('Destination : ' + destination) : null,
      datetime ? ('Date/heure : ' + datetime) : null,
      vehicle ? ('Véhicule : ' + (vehicle === 'van' ? 'Van' : 'Eco')) : null
    ].filter(Boolean).join(' | ');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Course BookRide' + (customerName ? (' — ' + customerName) : ''),
              description: description || undefined,
            },
            unit_amount: Math.round(Number(amount) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        customerName: customerName || '',
        customerPhone: customerPhone || '',
        pickup: pickup || '',
        destination: destination || '',
        datetime: datetime || '',
        vehicle: vehicle || ''
      },
      success_url: `https://${req.headers.host}/?paiement=succes`,
      cancel_url: `https://${req.headers.host}/?paiement=annule`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
