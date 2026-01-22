import { NextResponse } from "next/server";
import admin from "firebase-admin";

// ✅ evita inicializar 2x
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "Webhook online" }, { status: 200 });
}

export async function POST(request) {
  try {
    // ✅ validar token
    const token = process.env.KIWIFY_TOKEN;
    const receivedToken = request.headers.get("x-kiwify-token");

    if (!token) {
      return NextResponse.json({ error: "KIWIFY_TOKEN não configurado" }, { status: 500 });
    }

    if (receivedToken !== token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    // ✅ ler payload
    const data = await request.json();

    const event = data?.order?.webhook_event_type;
    const status = data?.order?.order_status;
    const email = data?.order?.Customer?.email;

    if (!email) {
      return NextResponse.json({ error: "Email não veio no webhook" }, { status: 400 });
    }

    // ✅ liberar acesso quando aprovado
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

    return NextResponse.json({ ok: true, released: false }, { status: 200 });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json(
      { ok: false, error: "Erro interno no webhook" },
      { status: 500 }
    );
  }
}
