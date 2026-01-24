import admin from "firebase-admin";

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
    
    // Identifica o status da ordem na Kiwify
    const status = data?.order_status; 
    const emailBruto = data?.Customer?.email || data?.customer?.email || data?.buyer?.email;

    if (!emailBruto) {
      return res.status(400).json({ error: "Email não enviado" });
    }

    const email = emailBruto.toLowerCase().trim();
    const db = admin.firestore();
    const userRef = db.collection("users").doc(email);

    // LÓGICA DE STATUS
    if (status === "paid" || status === "approved") {
      // COMPRA APROVADA
      await userRef.set({
        paid: true,
        pending: false,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ ACESSO LIBERADO: ${email}`);
    } 
    else if (status === "waiting_payment" || status === "pending") {
      // AGUARDANDO (Boleto/Pix gerado)
      await userRef.set({
        paid: false,
        pending: true,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`⏳ PAGAMENTO PENDENTE: ${email}`);
    } 
    else if (status === "refunded" || status === "charged_back" || status === "refused" || status === "canceled") {
      // FALHA, CANCELAMENTO OU REEMBOLSO
      await userRef.set({
        paid: false,
        pending: false,
        updatedAt: new Date().toISOString(),
        reason: status // Guarda o motivo do bloqueio
      }, { merge: true });
      console.log(`🚫 ACESSO BLOQUEADO (Status: ${status}): ${email}`);
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("❌ Erro no processamento do webhook:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
