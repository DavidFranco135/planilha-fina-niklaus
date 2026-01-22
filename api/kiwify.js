import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    { ok: true, message: "Webhook online" },
    { status: 200 }
  );
}

export async function POST(request) {
  try {
    const token = process.env.KIWIFY_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Token não configurado" }, { status: 500 });
    }

    const receivedToken = request.headers.get("x-kiwify-token");

    if (receivedToken !== token) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }

    const data = await request.json();
    console.log("✅ Webhook recebido:", data);

    // ✅ aqui você vai liberar o acesso depois (Firestore)
    return NextResponse.json({ ok: true, received: true }, { status: 200 });
  } catch (err) {
    console.error("❌ Erro no webhook:", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
