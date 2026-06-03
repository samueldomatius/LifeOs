import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import admin from 'firebase-admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// GET user data
app.get('/api/userdata/:userId?', async (req, res) => {
  const userId = req.params.userId || 'default';
  try {
    let data = await prisma.userData.findUnique({
      where: { id: userId }
    });

    // If no row exists, create and return a default template
    if (!data) {
      data = await prisma.userData.create({
        data: {
          id: userId,
          tasks: [],
          finances: [],
          currentDay: {},
          assets: [],
          savings: [],
          debts: [],
          history: [],
          chatHistory: [],
          userProfile: {
            name: 'User LifeOS',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
            bio: 'Mengelola hidup lebih teratur dengan LifeOS ✨'
          }
        }
      });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching user data via Prisma:", error);
    res.status(500).json({ error: "Failed to fetch user data", message: error.message });
  }
});

// POST/UPSERT user data
app.post('/api/userdata/:userId?', async (req, res) => {
  const userId = req.params.userId || 'default';
  const { tasks, finances, currentDay, assets, savings, debts, history, chatHistory, userProfile } = req.body;

  try {
    const data = await prisma.userData.upsert({
      where: { id: userId },
      update: {
        tasks: tasks || [],
        finances: finances || [],
        currentDay: currentDay || {},
        assets: assets || [],
        savings: savings || [],
        debts: debts || [],
        history: history || [],
        chatHistory: chatHistory || [],
        userProfile: userProfile || {}
      },
      create: {
        id: userId,
        tasks: tasks || [],
        finances: finances || [],
        currentDay: currentDay || {},
        assets: assets || [],
        savings: savings || [],
        debts: debts || [],
        history: history || [],
        chatHistory: chatHistory || [],
        userProfile: userProfile || {}
      }
    });

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error upserting user data via Prisma:", error);
    res.status(500).json({ error: "Failed to save user data", message: error.message });
  }
});

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await prisma.userData.findFirst({
      where: { email: normalizedEmail }
    });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const userId = 'user_' + Math.random().toString(36).substring(2, 15);
    const hashedPassword = hashPassword(password);

    const data = await prisma.userData.create({
      data: {
        id: userId,
        email: normalizedEmail,
        password: hashedPassword,
        tasks: [],
        finances: [],
        currentDay: {},
        assets: [],
        savings: [],
        debts: [],
        history: [],
        chatHistory: [],
        userProfile: {
          name: name || 'User LifeOS',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
          bio: 'Mengelola hidup lebih teratur dengan LifeOS ✨'
        }
      }
    });

    res.json({ success: true, userId, email: normalizedEmail, name: data.userProfile.name });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user", message: error.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.userData.findFirst({
      where: { email: normalizedEmail }
    });
    if (!user) {
      return res.status(400).json({ error: "Email not found" });
    }

    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    res.json({
      success: true,
      userId: user.id,
      email: user.email,
      name: (user.userProfile && user.userProfile.name) || 'User LifeOS'
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login", message: error.message });
  }
});

// --- Firebase Admin SDK & Push Notification Scheduler ---
let firebaseApp = null;
try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });
    console.log("🔥 Firebase Admin SDK initialized successfully.");
  } else {
    console.warn("⚠️ Firebase credentials missing in environment variables. Push notifications are disabled.");
  }
} catch (error) {
  console.error("❌ Failed to initialize Firebase Admin SDK:", error);
}

// In-memory cache of sent notification keys to prevent duplicates
const sentNotifications = new Set();

// Clear the cache once a day to prevent memory leaks
setInterval(() => {
  sentNotifications.clear();
  console.log("🧹 Cleared sent notifications cache.");
}, 24 * 60 * 60 * 1000);

// Helper to get formatted date and time in GMT+7 (Western Indonesian Time)
function getGMT7Time() {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * 7));
  
  const year = nd.getFullYear();
  const month = String(nd.getMonth() + 1).padStart(2, '0');
  const day = String(nd.getDate()).padStart(2, '0');
  const hours = String(nd.getHours()).padStart(2, '0');
  const minutes = String(nd.getMinutes()).padStart(2, '0');
  
  return {
    todayStr: `${year}-${month}-${day}`,
    timeStr: `${hours}:${minutes}`,
    rawDate: nd
  };
}

// Task push scheduler worker
async function checkAndSendPushNotifications() {
  if (!firebaseApp) return;

  try {
    const { todayStr, timeStr } = getGMT7Time();
    const allUsers = await prisma.userData.findMany();
    
    for (const user of allUsers) {
      const tasks = Array.isArray(user.tasks) ? user.tasks : [];
      let userProfile = {};
      
      try {
        userProfile = typeof user.userProfile === 'string' ? JSON.parse(user.userProfile) : (user.userProfile || {});
      } catch (e) {
        userProfile = user.userProfile || {};
      }
      
      const pushToken = userProfile.pushToken;
      if (!pushToken) continue;

      for (const t of tasks) {
        if (t.status === 'pending' && t.dueDate === todayStr && t.time) {
          const [taskHr, taskMin] = t.time.split(':').map(Number);
          const [currentHr, currentMin] = timeStr.split(':').map(Number);
          
          const taskTimeMins = taskHr * 60 + taskMin;
          const currentTimeMins = currentHr * 60 + currentMin;
          const diffMins = taskTimeMins - currentTimeMins;

          // 1. H-5 Minutes reminder
          if (diffMins === 5) {
            const notifKey = `${user.id}_h5_${t.id}`;
            if (!sentNotifications.has(notifKey)) {
              sentNotifications.add(notifKey);
              
              admin.messaging().send({
                token: pushToken,
                notification: {
                  title: "⏰ Tugas Mendatang (H-5 Menit)",
                  body: `Tugas "${t.text}" akan dimulai dalam 5 menit (Jadwal: ${t.time})`,
                },
                android: {
                  priority: 'high',
                  notification: {
                    sound: 'default',
                    channelId: 'default'
                  }
                },
                apns: {
                  payload: {
                    aps: {
                      sound: 'default'
                    }
                  }
                }
              }).then(() => {
                console.log(`Successfully sent H-5 push for task: ${t.id} to user: ${user.id}`);
              }).catch(err => {
                console.error(`Failed to send push notification to user ${user.id}:`, err.message);
              });
            }
          }

          // 2. Exact start time reminder (H-0)
          if (diffMins === 0) {
            const notifKey = `${user.id}_now_${t.id}`;
            if (!sentNotifications.has(notifKey)) {
              sentNotifications.add(notifKey);

              admin.messaging().send({
                token: pushToken,
                notification: {
                  title: "🚨 Waktu Tugas Mulai!",
                  body: `Saatnya mengerjakan: "${t.text}" (Jadwal: ${t.time})`,
                },
                android: {
                  priority: 'high',
                  notification: {
                    sound: 'default',
                    channelId: 'default'
                  }
                },
                apns: {
                  payload: {
                    aps: {
                      sound: 'default'
                    }
                  }
                }
              }).then(() => {
                console.log(`Successfully sent H-0 push for task: ${t.id} to user: ${user.id}`);
              }).catch(err => {
                console.error(`Failed to send push notification to user ${user.id}:`, err.message);
              });
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in checkAndSendPushNotifications scheduler:", error);
  }
}

// Endpoint to trigger push notifications check (designed for serverless cron jobs)
app.get('/api/cron-check-push', async (req, res) => {
  // Simple check for authorization to secure the endpoint if CRON_SECRET is set
  const cronSecret = req.headers['authorization'] || req.query.secret;
  if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    await checkAndSendPushNotifications();
    res.json({ success: true, message: "Push notification check completed." });
  } catch (error) {
    console.error("Cron push notification check failed:", error);
    res.status(500).json({ error: "Failed to run push notification check", message: error.message });
  }
});

// Start checking for push notifications every 60 seconds (ONLY in local development)
if (process.env.NODE_ENV !== 'production') {
  console.log("⏱️ Dev mode: Running local setInterval scheduler for push notifications.");
  setInterval(checkAndSendPushNotifications, 60 * 1000);
}

// Endpoint for testing push notifications directly
app.post('/api/test-push', async (req, res) => {
  const { token, title, body } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }
  if (!firebaseApp) {
    return res.status(500).json({ error: "Firebase is not initialized. Please configure credentials in .env." });
  }

  try {
    const response = await admin.messaging().send({
      token,
      notification: {
        title: title || "Test Push Notif",
        body: body || "Halo! Ini adalah notifikasi uji coba dari server LifeOS."
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default'
          }
        }
      }
    });
    res.json({ success: true, messageId: response });
  } catch (error) {
    console.error("Error sending test push notification:", error);
    res.status(500).json({ error: "Failed to send notification", message: error.message });
  }
});

// Endpoint to retrieve AI API keys dynamically
app.get('/api/ai-keys', (req, res) => {
  const keys = process.env.VITE_GEMINI_API_KEYS || "";
  res.json({ keys });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', framework: 'Prisma Client + Express' });
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Prisma backend listening on http://localhost:${PORT}`);
  });
}

export default app;
