import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/ai", async (req, res) => {
  try {
    const { totals, currentTransactions, userQuestion } = req.body;

    const prompt = `
Você é um mentor financeiro chamado Niklaus.
Usuário perguntou: "${userQuestion}"

Dados financeiros:
Totais: ${JSON.stringify(totals)}
Transações: ${JSON.stringify(currentTransactions)}

Responda de forma clara, prática e objetiva.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });

  } catch (err) {
    console.error("Erro Gemini:", err);
    res.status(500).json({ error: "Erro ao consultar IA" });
  }
});
