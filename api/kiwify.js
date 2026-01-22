import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  // suas configs aqui
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const data = req.body;

    console.log("WEBHOOK DATA:", JSON.stringify(data, null, 2));

    const status = data?.order?.order_status;
    const email  = data?.order?.Customer?.email;

    if (!status || !email) {
      return res.status(400).json({ error: "Payload inválido" });
    }

    // Ativação automática
    if (status === "paid") {
      await setDoc(doc(db, "usuarios", email), {
        email: email,
        status: "paid",
        plano: "premium",
        origem: "kiwify",
        order_id: data.order.order_id,
        produto: data.order.Product.product_name,
        data_pagamento: new Date().toISOString()
      }, { merge: true });
    }

    // Bloqueio automático
    if (status === "refunded") {
      await setDoc(doc(db, "usuarios", email), {
        status: "refunded"
      }, { merge: true });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
