import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import Groq from "groq-sdk";
import kiwifyWebhook from "./kiwify-webhook.js";
import admin from "firebase-admin";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ========================
// Firebase Admin
// ========================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(
      JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    ),
  });
}

const db = admin.firestore();

// ========================
// Groq / Niklaus
// ========================
const groq = new Groq({ apiKey: process.env.GROQ_KEY });

const temasPiadas = [
  "investimentos",
  "bancos",
  "boletos",
  "cartão de crédito",
  "cripto",
  "inflação",
  "aposentadoria",
];

// ========================
// ROTA IA
// ========================
app.post("/gemini", async (req, res) => {
  try {
    const { mensagem, nomeUsuario } = req.body;
    const tema = temasPiadas[Math.floor(Math.random() * temasPiadas.length)];

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      temperature: 0.9,
      messages: [
        {
          role: "system",
          content: `Você é Niklaus, mentor financeiro. Nome do usuário: ${
            nomeUsuario || "Amigo"
          }. Dê 3 dicas curtas com emojis e conte uma piada inédita sobre ${tema}.`,
        },
        { role: "user", content: mensagem },
      ],
    });

    res.json({ resposta: completion.choices[0].message.content });
  } catch (err) {
    console.error("Erro IA:", err);
    res.status(500).json({ erro: "Niklaus deu uma saidinha 😅" });
  }
});

// ========================
// WEBHOOK KIWIFY
// ========================
app.post("/webhook-kiwify", kiwifyWebhook);

// ========================
// ADMIN → USUÁRIO (DIRECT MESSAGE)
// ========================
app.post("/enviar-mensagem", async (req, res) => {
  try {
    const { userId, mensagem } = req.body;
    if (!userId || !mensagem)
      return res.status(400).json({ erro: "Faltando dados" });

    const docRef = await db.collection("suggestions").add({
      userId,
      userName: "Niklaus (Direto)",
      message: `[MENSAGEM DO ADMIN]: ${mensagem}`,
      isDirect: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      reply: mensagem,
      replyViewed: false,
    });

    res.json({ sucesso: true, id: docRef.id });
  } catch (err) {
    console.error("Erro enviar mensagem:", err);
    res.status(500).json({ erro: "Erro ao enviar mensagem" });
  }
});

// ========================
// LISTAR USUÁRIOS
// ========================
app.get("/usuarios", async (req, res) => {
  try {
    const snapshot = await db.collection("users").get();
    const usuarios = snapshot.docs.map((doc) => ({
      id: doc.id,
      email: doc.data().email,
      appName: doc.data().appName || "Usuário",
    }));
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao listar usuários" });
  }
});
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// ========================
// LISTAR HISTÓRICO
// ========================
app.get("/historico-geral", async (req, res) => {
  try {
    const snapshot = await db
      .collection("suggestions")
      .orderBy("createdAt", "desc")
      .get();

    const historico = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));

    res.json(historico);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar histórico" });
  }
});

// ========================
// RESPONDER SUGESTÃO
// ========================
app.post("/responder-sugestao", async (req, res) => {
  try {
    const { sugestaoId, resposta } = req.body;
    if (!sugestaoId || !resposta)
      return res.status(400).json({ erro: "Faltando dados" });

    const sugRef = db.collection("suggestions").doc(sugestaoId);
    const sugDoc = await sugRef.get();
    if (!sugDoc.exists)
      return res.status(404).json({ erro: "Sugestão não encontrada" });

    await sugRef.update({
      reply: resposta,
      replyViewed: false,
      repliedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao responder" });
  }
});

// ========================
app.get("/", (req, res) =>
  res.send("Servidor Niklaus Online 🚀")
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Servidor rodando na porta ${PORT}`)
);
