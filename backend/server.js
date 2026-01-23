import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import admin from "firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";
import kiwifyHandler from "./kiwify-webhook.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

// Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Webhook Kiwify
app.post("/kiwify-webhook", kiwifyHandler);

// IA
app.post("/ai", async (req, res) => {
  try {
    const { totals, currentTransactions, userQuestion } = req.body;

    if (!userQuestion) {
      return res.json({ reply: "Faça uma pergunta ao Mentor IA." });
    }

    const prompt = `
Você é um mentor financeiro chamado Niklaus.
Pergunta do usuário: ${userQuestion}

Totais: ${JSON.stringify(totals)}
Transações: ${JSON.stringify(currentTransactions)}

Responda de forma clara, prática e objetiva.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });

  } catch (err) {
    console.error("Erro IA:", err);
    res.status(500).json({ error: "Erro ao consultar IA" });
  }
});

// 🔥 ESSA LINHA É O QUE IMPEDE "Application exited early"
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
