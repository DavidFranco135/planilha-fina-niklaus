import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  try {
    const payload = req.body;

    const email = payload?.order?.Customer?.email;
    const statusKiwify = payload?.order?.order_status; // paid, refunded, etc

    if (!email) {
      return res.status(400).json({ error: "Email não encontrado no payload" });
    }

    let statusSistema = "pending";

    if (statusKiwify === "paid") {
      statusSistema = "paid";
    }

    await db.collection("usuarios").doc(email).set({
      email: email,
      status: statusSistema,   // 🔥 padrão do app
      order_id: payload.order.order_id,
      produto: payload.order.Product.product_name,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({
      ok: true,
      email,
      status: statusSistema
    });

  } catch (err) {
    console.error("ERRO WEBHOOK:", err);
    return res.status(500).json({ error: "Erro interno no webhook" });
  }
}
