import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

export default async function handler(req, res) {
  try {
    const data = req.body;

    const email =
      data?.Customer?.email ||
      data?.customer?.email ||
      data?.buyer?.email ||
      data?.order?.customer?.email ||
      null;

    if (!email) {
      console.log("Webhook recebido, mas sem email:", data);
      return res.status(400).json({ error: "Email não encontrado no webhook" });
    }

    const db = admin.firestore();
await db.collection("users").doc(email).set(
  {
    status: "paid",        // 👈 ESSENCIAL
    paid: true,
    pending: false,
    paidAt: new Date().toISOString(),
  },
  { merge: true }
);

    console.log("Acesso liberado para:", email);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro webhook:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
