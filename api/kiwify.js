import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD9vzjo_nrSjaRZ5sXK7G4fhnTTxIW7c-k",
  authDomain: "planilha-fina.firebaseapp.com",
  projectId: "planilha-fina",
  storageBucket: "planilha-fina.firebasestorage.app",
  messagingSenderId: "288466007894",
  appId: "1:288466007894:web:e917cc6eeac421671188f7"
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

    // ATIVAÇÃO AUTOMÁTICA
    if (status === "paid") {
      await setDoc(doc(db, "usuarios", email), {
        email,
        status: "paid",
        origem: "kiwify",
        produto: data.order.Product.product_name,
        order_id: data.order.order_id,
        data_pagamento: new Date().toISOString()
      }, { merge: true });
    }

    // BLOQUEIO AUTOMÁTICO (reembolso)
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
