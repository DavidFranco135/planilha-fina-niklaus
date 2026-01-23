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

// ================= FIREBASE ADMIN =================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

// ================= GEMINI =================
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ================= WEBHOOK KIWIFY =================
app.post("/kiwify-webhook", kiwifyHandler);

// ================= IA =================
app.post("/ai", async (req, res) => {
  try {
    const { totals, currentTransactions, userQuestion } = req.body;

    if (!userQuestion || !userQuestion.trim()) {
      return res.json({ reply: "Digite uma pergunta para o Mentor IA." });
    }

    const prompt = `
Você é um mentor financeiro chamado Niklaus.
Você fala português brasileiro.
Você é direto, claro, prático e estratégico.

Pergunta do usuário:
"${userQuestion}"

Dados financeiros:
Totais: ${JSON.stringify(totals)}
Transações: ${JSON.stringify(currentTransactions)}

Responda de forma clara, prática e objetiva, com dicas reais e aplicáveis.
`;

    // MODELO CORRETO
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return res.json({ reply });

  } catch (err) {
    console.error("Erro IA:", err);
    return res.status(500).json({
      reply: "Erro ao consultar a IA. Tente novamente em instantes."
    });
  }
});

// ================= SERVER =================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Backend rodando na porta ${PORT}`);
});
