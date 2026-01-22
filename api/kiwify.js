export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(200).json({ ok: true, message: "Webhook online" });
    }

    const token = process.env.KIWIFY_TOKEN;

    if (!token) {
      return res.status(500).json({ error: "Token não configurado" });
    }

    const receivedToken = req.headers["x-kiwify-token"];

    if (receivedToken !== token) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const data = req.body;

    console.log("Webhook recebido:", data);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return res.status(500).json({ error: "Erro interno" });
  }
}