import { NextResponse } from "next/server";
import admin from "firebase-admin";

// ✅ Firebase Admin (só inicia 1 vez)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function POST(request) {
  try {
    const token = process.env.KIWIFY_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Token não configurado" }, { status: 500 });
    }

    // ✅ Token da Kiwify no header
    const receivedToken = request.headers.get("x-kiwify-token");
    if (receivedToken !== token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // ✅ Pega JSON
    const data = await request.json();

    console.log("Webhook recebido:", data);

    const event = data?.order?.webhook_event_type;  // "order_approved"
    const status = data?.order?.order_status;       // "paid"
    const email = data?.order?.Customer?.email;     // comprador

    if (!email) {
      return NextResponse.json({ error: "Email não encontrado" }, { status: 400 });
    }

    // ✅ Se pagamento aprovado, libera
    if (event === "order_approved" && status === "paid") {
      const db = admin.firestore();

      await db.collection("usersByEmail").doc(email).set(
        {
          paid: true,
          plan: "premium",
          orderId: data?.order?.order_id,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      return NextResponse.json({ ok: true, released: true }, { status: 200 });
    }

    // Outros eventos (boleto pendente, etc)
    return NextResponse.json({ ok: true, released: false }, { status: 200 });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

// ✅ Opcional: GET só pra testar se ta online
export async function GET() {
  return NextResponse.json({ ok: true, message: "Webhook online" }, { status: 200 });
}
