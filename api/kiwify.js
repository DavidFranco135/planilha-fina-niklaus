import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

export default async function handler(req, res) {
  if(req.method !== "POST"){
    return res.status(405).json({ error: "Método não permitido" });
  }

  const data = req.body;

  if(data.order_status === "paid"){
    const email = data.customer.email;

    await setDoc(doc(db, "usuarios", email), {
      email: email,
      status: "paid",
      plano: "premium",
      origem: "kiwify",
      data_pagamento: new Date().toISOString()
    }, { merge: true });
  }

  res.status(200).json({ ok: true });
}
