import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_BUCKET",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).json({ ok: true, message: "Webhook online" });
    }

    const data = req.body;

    const status = data?.order?.order_status;
    const email  = data?.order?.Customer?.email;

    if (!status || !email) {
      return res.status(400).json({ error: "Payload inválido" });
    }

    if (status === "paid") {
      await setDoc(doc(db, "usuarios", email), {
        email,
        status: "paid",
        origem: "kiwify",
        data_pagamento: new Date().toISOString()
      }, { merge: true });
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}
