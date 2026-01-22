// Este arquivo deve ser colocado na pasta /api/ do seu projeto Vercel (ex: api/webhook.js)
// Ele usa a Firebase Admin SDK para atualizar o status do usuário.

/*
  Como configurar:
  1. No Firebase Console -> Configurações do Projeto -> Contas de Serviço -> Gerar nova chave privada.
  2. Adicione as variáveis de ambiente no Vercel com os dados do JSON baixado.
*/

const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}

const db = admin.firestore();

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
    }

    const { order_status, customer } = req.body;

    // Verifica se o pagamento foi aprovado
    if (order_status === 'paid' || order_status === 'completed') {
        const email = customer.email.toLowerCase();
        const safeId = email.replace(/[^a-z0-9]/g, '_');

        try {
            const userRef = db.collection('users').doc(safeId);
            const userDoc = await userRef.get();

            if (userDoc.exists) {
                // Atualiza o status do usuário existente
                await userRef.update({ status: 'paid' });
            } else {
                // Se o usuário não existe, cria ele já como pago
                // Ele poderá acessar usando o e-mail como senha inicial se você quiser
                await userRef.set({
                    email: email,
                    password: email, 
                    status: 'paid',
                    appName: 'Meu Perfil',
                    secondaryName: 'Conta 2',
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            console.log(`Usuário ${email} ativado com sucesso.`);
            return res.status(200).json({ success: true, message: 'Usuário ativado' });
        } catch (error) {
            console.error('Erro no Webhook:', error);
            return res.status(500).json({ error: 'Erro interno ao processar ativação' });
        }
    }

    return res.status(200).send('OK');
};
