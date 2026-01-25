import admin from "firebase-admin";

// Inicialização do Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const db = admin.firestore();

export default async function kiwifyWebhook(req, res) {
  try {
    const data = req.body;
    
    // Captura o status e o e-mail de forma resiliente
    const orderData = data?.order;
    const status = data?.order_status || orderData?.order_status;
    
    const emailBruto = orderData?.Customer?.email || 
                       data?.Customer?.email || 
                       data?.customer?.email ||
                       orderData?.email;

    if (!emailBruto) {
      console.error("❌ Webhook Kiwify: Email não encontrado no JSON recebido.");
      return res.status(400).json({ error: "Email não encontrado" });
    }

    const emailNormalizado = emailBruto.toLowerCase().trim();
    // Gera o ID com underlines para bater com o seu Front-end
    const safeId = emailNormalizado.replace(/[^a-z0-9]/g, '_'); 

    const userRef = db.collection("users").doc(safeId);

    console.log(`Log Kiwify - Status: ${status} | Usuario: ${emailNormalizado}`);

    if (status === "paid" || status === "approved") {
      await userRef.set({
        paid: true,
        status: 'paid',
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`✅ Acesso LIBERADO: ${safeId}`);
    } 
    else if (status === "refunded" || status === "charged_back" || status === "disputed") {
      await userRef.set({
        paid: false,
        status: 'refunded',
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`🚫 Acesso BLOQUEADO: ${safeId}`);
    }
    else {
      await userRef.set({
        kiwifyStatus: status,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("❌ Erro no processamento do Webhook:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
