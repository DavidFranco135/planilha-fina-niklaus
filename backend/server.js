import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import dotenv from "dotenv";

// Node 18+ já tem fetch global (Render usa Node 22)
dotenv.config();

// ===============================
// App
// ===============================
const app = express();   // ✅ AGORA app existe
app.use(cors());
app.use(express.json());

// ===============================
// Firebase Admin
// ===============================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

// ===============================
// Webhook Kiwify
// ===============================
import kiwifyWebhook from "./kiwify-webhook.js";
app.post("/kiwify-webhook", kiwifyWebhook);

// ===============================
// Rota IA (Gemini API REST - definitiva)
// ===============================
app.post("/ai", async (req, res) => {
  try {
    const { totals, currentTransactions, userQuestion } = req.body;

    const prompt = `
Você é o Niklaus, um assistente financeiro inteligente.

Dados do usuário:
Totais: ${JSON.stringify(totals)}
Transações: ${JSON.stringify(currentTransactions)}

Pergunta:
${userQuestion}

Regras:
- Responder em português
- Linguagem simples
- Consultoria prática
- Dicas reais
- Ações aplicáveis
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!data.candidates || !data.candidates[0]) {
      console.error("Resposta inválida Gemini:", data);
      return res.status(500).json({ reply: "Erro ao consultar a IA" });
    }

    const reply = data.candidates[0].content.parts[0].text;

    res.json({ reply });

  } catch (err) {
    console.error("Erro Gemini:", err);
    res.status(500).json({ reply: "Erro ao consultar a IA" });
  }
});

// ===============================
// Start server
// ===============================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
