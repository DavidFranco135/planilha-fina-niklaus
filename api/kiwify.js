import { NextResponse } from "next/server";
import admin from "firebase-admin";

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
    // ✅ validar token da Kiwify
    const token = process.env.KIWIFY_TOKEN;
    const receivedToken = request.headers.get("x-kiwify-token");

    if (!token) {
      return NextResponse.json({ error: "KIWIFY_TOKEN não configurado" }, { status: 500 });
    }

    if (receivedToken !== token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const data = await request.json();

    const event = data?.order?.webhook_event_type;
    const status = data?.order?.order_status;
    const email = data?.order?.Customer?.email?.toLowerCase();

    if (!email) {
      return NextResponse.json({ error: "Email não encontrado no webhook" }, { status: 400 });
    }

    // ✅ só libera se realmente aprovado
    if (event !== "order_approved" || status !== "paid") {
      return NextResponse.json({ ok: true, released: false }, { status: 200 });
    }

    const db = admin.firestore();

    // ✅ acha o usuário
