import admin from "firebase-admin";

if (!admin.apps.length) {
  const privateKey = Buffer.from(
    process.env.FIREBASE_PRIVATE_KEY_BASE64,
    "base64"
  ).toString("utf-8");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "planilha-fina",
      clientEmail: "firebase-adminsdk-fbsvc@planilha-fina.iam.gserviceaccount.com",
      privateKey: privateKey,
    }),
  });
}
