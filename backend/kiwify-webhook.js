import admin from "firebase-admin";

// Inicializa o Firebase apenas se não estiver inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

export default async function kiwifyWebhook(req, res) {
  try {
    const data = req.body;

    // Captura o email independente de como a Kiwify envie o campo
    const emailBruto = data?.Customer?.email || data?.customer?.email || data?.buyer?.email;
    
    if (!emailBruto) {
      return res.status(400).json({ error: "Email não encontrado" });
    }

    const email = emailBruto.toLowerCase().trim();
    const db = admin.firestore();

    // Gravação imediata no Firestore
    await db.collection("users").doc(email).set({
      paid: true,
      pending: false,
      paidAt: new Date().toISOString(),
      updatedBy: "webhook_kiwify"
    }, { merge: true });

    console.log(`✅ Acesso liberado: ${email}`);
    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("❌ Erro Webhook:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
