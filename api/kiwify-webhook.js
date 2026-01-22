import admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = Buffer.from(
    process.env.FIREBASE_PRIVATE_KEY_BASE64,
    "base64"
  ).toString("utf-8");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "planilha-fina",
      clientEmail: "firebase-adminsdk-fbsvc@planilha-fina.iam.gserviceaccount.com",
      privateKey: privateKey,
    }),
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const body = req.body;
    console.log("📦 Payload recebido:", JSON.stringify(body, null, 2));

    const order = body.order;
    if (!order) {
      return res.status(400).json({ error: "Payload inválido" });
    }

    if (order.order_status !== "paid") {
      return res.status(200).json({ ok: true, status: "ignorado" });
    }

    const email = order.Customer?.email;
    if (!email) {
      return res.status(400).json({ error: "Email não encontrado no payload" });
    }

    const db = admin.firestore();

    await db.collection("usuarios").doc(email).set({
      email: email,
      status: "paid",
      paid: true,
      product: order.Product?.product_name || "desconhecido",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({
      ok: true,
      email,
      status: "liberado"
    });

  } catch (err) {
    console.error("❌ ERRO NO WEBHOOK:", err);
    return res.status(500).json({ error: "Erro interno no webhook", details: err.message });
  }
}
