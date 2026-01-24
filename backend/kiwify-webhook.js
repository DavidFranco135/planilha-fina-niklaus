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
    
    // A Kiwify envia os dados dentro de 'order'
    const orderData = data?.order;
    const status = orderData?.order_status;
    const emailBruto = orderData?.Customer?.email;

    if (!emailBruto) {
      console.error("❌ Webhook recebido sem email de cliente.");
      return res.status(400).json({ error: "Email não encontrado" });
    }

    const email = emailBruto.toLowerCase().trim();
    const db = admin.firestore();
    const userRef = db.collection("users").doc(email);

    console.log(`Operação: ${status} para o usuário: ${email}`);

    // LÓGICA DE BLOQUEIO / LIBERAÇÃO
    if (status === "paid" || status === "approved") {
      // LIBERA ACESSO
      await userRef.set({
        paid: true,
        pending: false,
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ Usuário Liberado: ${email}`);
    } 
    else if (status === "refunded" || status === "charged_back") {
      // BLOQUEIO AUTOMÁTICO POR REEMBOLSO
      await userRef.set({
        paid: false,
        pending: false, // Defina como false para bloquear o acesso se seu front checa 'paid'
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`🚫 Usuário BLOQUEADO (Reembolso): ${email}`);
    }
    else {
      // Outros status (ex: recusado, pendente)
      await userRef.set({
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("❌ Erro fatal no Webhook:", err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
}
