const admin = require('firebase-admin');

const getFirebaseAdmin = () => {
  if (admin.apps.length > 0) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error("Variáveis de ambiente do Firebase não encontradas no Vercel.");
  }

  // Corrige quebras de linha
  privateKey = privateKey.replace(/\\n/g, '\n');

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return admin;
};

module.exports = async (req, res) => {

  // Teste no navegador
  if (req.method === 'GET') {
    return res.status(200).send('✅ Webhook online. Aguardando POST da Kiwify.');
  }

  if (req.method !== 'POST') {
    return res.status(405).send('Método não permitido');
  }

  try {
    const fb = getFirebaseAdmin();
    const db = fb.firestore();

    const payload = req.body;

    // Compatível com payload real da Kiwify
    const order = payload?.order;
    const order_status = order?.order_status;
    const customer = order?.Customer;

    if (!order || !customer || !customer.email) {
      console.error("Payload inválido:", JSON.stringify(payload, null, 2));
      return res.status(400).json({ error: 'Payload inválido da Kiwify' });
    }

    const email = customer.email.toLowerCase();
    const safeId = email.replace(/[^a-z0-9]/g, '_');

    const approvedStatus = ['paid', 'completed', 'approved', 'authorized'];

    if (approvedStatus.includes(order_status)) {
      const userRef = db.collection('users').doc(safeId);

      await userRef.set({
        status: 'paid',
        email: email,
        origem: 'kiwify',
        activatedAt: admin.firestore.FieldValue.serverTimestamp(),
        orderId: order.order_id || null
      }, { merge: true });

      console.log(`✅ ATIVADO: ${email}`);
      return res.status(200).json({ success: true });
    }

    console.log(`ℹ️ Status recebido sem ação: ${order_status}`);
    return res.status(200).json({ ignored: true, status: order_status });

  } catch (error) {
    console.error('🔥 ERRO WEBHOOK:', error);
    return res.status(500).json({
      error: 'Erro interno no webhook',
      message: error.message
    });
  }
};
