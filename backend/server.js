import express from "express";
import cors from "cors";
import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import kiwifyWebhook from "./kiwify-webhook.js";

dotenv.config();

const app = express(); // ✅ agora app existe
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
// Gemini AI
// ===============================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ===============================
// Webhook Kiwify
// ===============================
app.post("/kiwify-webhook", kiwifyWebhook);

// ===============================
// Rota IA real
// ===============================
app.post("/ai", async (req, res) => {
  try {
    const { totals, currentTransactions, userQuestion } = req.body;

   const model = genAI.getGenerativeModel({ model: "models/gemini-1.0-pro" });



    const prompt = `
Você é o Niklaus, um assistente financeiro inteligente.
Especialista em finanças pessoais, organização financeira e planejamento.

Dados do usuário:
Totais: ${JSON.stringify(totals)}
Transações: ${JSON.stringify(currentTransactions)}

Pergunta do usuário:
${userQuestion}

Regras:
- Responder em português
- Ser claro
- Ser prático
- Dar ações reais
- Linguagem simples
- Estilo consultor financeiro
    `;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    res.json({ reply: response });

  } catch (err) {
    console.error("Erro Gemini:", err);
    res.status(500).json({ reply: "Erro ao consultar a IA" });
  }
});

// ===============================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
