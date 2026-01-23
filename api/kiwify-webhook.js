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
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const data = req.body;

    console.log("Webhook recebido:", JSON.stringify(data, null, 2));

    const email =
      data?.Customer?.email ||
      data?.customer?.email ||
      data?.buyer?.email ||
      data?.order?.customer?.email ||
      data?.order?.email ||
      null;

    if (!email) {
      console.log("Webhook sem email:", data);
      return res.status(400).json({ error: "Email não encontrado no webhook" });
    }

    const safeId = email.toLowerCase().trim().replace(/[^a-z0-9]/g, "_");

    const db = admin.firestore();

    // 🔁 STATUS DINÂMICO (paid / refunded / pending)
    let status = "pending";

    const orderStatus =
      data?.order_status ||
      data?.order?.status ||
      data?.order?.order_status ||
      "";

    if (orderStatus === "paid" || orderStatus === "approved") {
      status = "paid";
    }

    if (orderStatus === "refunded" || orderStatus === "chargeback") {
      status = "pending";
    }

    await db.collection("users").doc(safeId).set(
      {
        email,
        status,
        paid: status === "paid",
        pending: status !== "paid",
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    console.log("Status atualizado:", email, "=>", status);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
