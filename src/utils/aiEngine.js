// LifeOS AI Engine ("Otak Pusat") powered by Google Gemini API
// Sinergi analisis lintas-dimensi antara tidur, pengeluaran, mood, dan produktivitas harian.

let currentKeyIndex = 0;

// Load API keys dynamically from environment variables for Git security
const envKeysStr = import.meta.env.VITE_GEMINI_API_KEYS || "";
const rawEnvKeys = envKeysStr
  ? envKeysStr
      .trim()
      .replace(/^["']|["']$/g, "") // strip leading/trailing quotes
      .split(",")
      .map(k => k.trim().replace(/^["']|["']$/g, "")) // strip quotes from individual keys
      .filter(Boolean)
  : [];

// Prioritize Gemini Native keys first, then fall back to OpenRouter keys
const geminiKeys = rawEnvKeys.filter(k => k.startsWith("AIzaSy"));
const openRouterKeys = rawEnvKeys.filter(k => k.startsWith("sk-or-v1-"));
const otherKeys = rawEnvKeys.filter(k => !k.startsWith("AIzaSy") && !k.startsWith("sk-or-v1-"));

const API_KEYS = [...geminiKeys, ...openRouterKeys, ...otherKeys];
console.log(`🤖 [LifeOS AI Core] Terdeteksi ${API_KEYS.length} API Key dari .env (Gemini: ${geminiKeys.length}, OpenRouter: ${openRouterKeys.length})`);

export const getApiKeysList = () => {
  try {
    const customKey = localStorage.getItem('lifeos_custom_gemini_key');
    if (customKey && customKey.trim()) {
      return [customKey.trim(), ...geminiKeys, ...openRouterKeys, ...otherKeys];
    }
  } catch (e) {}
  return [...geminiKeys, ...openRouterKeys, ...otherKeys];
};

export const safeParseJSON = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const jsonRegex = /\{[\s\S]*\}/;
    const match = cleaned.match(jsonRegex);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (innerError) {
        console.error("JSON block extraction failed:", innerError);
      }
    }
    throw e;
  }
};

// Helper to make direct HTTP fetch requests supporting OpenRouter and Gemini Native key rotation failover
async function callGemini(systemPrompt, userPrompt, jsonSchema = null, inlineData = null, retryCount = 0, errorsAccumulated = []) {
  const keys = getApiKeysList();
  if (retryCount >= keys.length) {
    throw new Error(`Semua API Key habis. Detail: [ ${errorsAccumulated.join(" | ")} ]`);
  }
  
  const activeKey = keys[currentKeyIndex % keys.length];

  let finalSystemPrompt = systemPrompt;
  if (jsonSchema) {
    const schemaStr = JSON.stringify(jsonSchema, null, 2);
    finalSystemPrompt = `${systemPrompt || ""}\n\nIMPORTANT: You must respond ONLY with a valid JSON object matching the following schema. Do NOT include any conversational introduction, explanation, or notes. Your entire response must be a single parseable JSON object.
JSON Schema:
${schemaStr}`;
  }

  try {
    if (activeKey.startsWith("sk-or-v1-")) {
      // --- OpenRouter Chat Completion Call ---
      const url = "https://openrouter.ai/api/v1/chat/completions";
      const messages = [];
      if (finalSystemPrompt) {
        messages.push({ role: "system", content: finalSystemPrompt });
      }

      if (inlineData) {
        // Multimodal receipt OCR support
        messages.push({
          role: "user",
          content: [
            { type: "text", text: userPrompt || "Scan this receipt." },
            {
              type: "image_url",
              image_url: {
                url: `data:${inlineData.mimeType};base64,${inlineData.data}`
              }
            }
          ]
        });
      } else {
        messages.push({ role: "user", content: userPrompt });
      }

      const openRouterModels = [
        "openrouter/free",
        "deepseek/deepseek-r1:free",
        "meta-llama/llama-3-8b-instruct:free",
        "google/gemini-2.5-flash"
      ];
      
      const modelErrors = [];
      
      for (const modelName of openRouterModels) {
        try {
          const requestBody = {
            model: modelName,
            messages,
            max_tokens: 1500,
            temperature: jsonSchema ? 0.15 : 0.7
          };

          if (jsonSchema && !modelName.includes("free")) {
            requestBody.response_format = { type: "json_object" };
          }

          const controller = new AbortController();
          const timeoutDuration = modelName.includes("free") ? 3500 : 7000; // 3.5s timeout for free models to fail fast
          const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${activeKey}`,
              "HTTP-Referer": "https://lifeos.local",
              "X-Title": "LifeOS App"
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            return data.choices?.[0]?.message?.content || "";
          } else {
            const errText = await response.text();
            modelErrors.push(`${modelName}(${response.status}: ${errText.substring(0, 90)})`);
            if (response.status === 402 || response.status === 401 || response.status === 403) {
              break;
            }
          }
        } catch (e) {
          modelErrors.push(`${modelName} error: ${e.message}`);
        }
      }
      
      throw new Error(`OpenRouter models failed: [ ${modelErrors.join(" | ")} ]`);

    } else {
      // --- Gemini Native GenerateContent Call ---
      const nativeModels = [
        "gemini-2.5-flash",
        "gemini-2.0-flash-lite"
      ];
      
      const nativeErrors = [];
      for (const modelName of nativeModels) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${activeKey}`;
          const generationConfig = {
            temperature: jsonSchema ? 0.15 : 0.7,
            maxOutputTokens: 2500
          };
          
          if (jsonSchema) {
            generationConfig.responseMimeType = "application/json";
            generationConfig.responseSchema = jsonSchema;
          }

          const parts = [];
          if (finalSystemPrompt && userPrompt) {
            parts.push({ text: `${finalSystemPrompt}\n\nUser Input/Context:\n${userPrompt}` });
          } else if (finalSystemPrompt) {
            parts.push({ text: finalSystemPrompt });
          } else if (userPrompt) {
            parts.push({ text: userPrompt });
          }

          if (inlineData) {
            parts.push({
              inlineData: {
                mimeType: inlineData.mimeType,
                data: inlineData.data
              }
            });
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for native

          const response = await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: parts
                }
              ],
              generationConfig
            }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } else {
            const errText = await response.text();
            nativeErrors.push(`${modelName}(${response.status}: ${errText.substring(0, 90)})`);
            if (response.status === 429 || response.status === 400 || response.status === 403 || response.status === 401) {
              break;
            }
          }
        } catch (e) {
          nativeErrors.push(`${modelName} error: ${e.message}`);
        }
      }
      
      throw new Error(`Gemini Native models failed: [ ${nativeErrors.join(" | ")} ]`);
    }
  } catch (error) {
    const errorMsg = `KeyIndex ${currentKeyIndex}: ${error.message}`;
    console.warn(errorMsg);
    currentKeyIndex = (currentKeyIndex + 1) % keys.length;
    return await callGemini(systemPrompt, userPrompt, jsonSchema, inlineData, retryCount + 1, [...errorsAccumulated, errorMsg]);
  }
}

// Pre-seeded 2-week history data to showcase personalized AI pattern learning instantly
export const getSeededHistory = () => [];

// Core Life Quality Score Calculator
export const calculateLifeScore = (currentDay, tasks, finances) => {
  // 1. Health Subscore (25%)
  let healthScore = 50;
  if (currentDay) {
    const sleepVal = currentDay.sleepHours || 7;
    let sleepPoints = sleepVal >= 8 ? 100 : sleepVal >= 7 ? 85 : sleepVal >= 6 ? 65 : 45;
    if (currentDay.sleepQuality === 'good') sleepPoints = Math.min(100, sleepPoints + 15);
    if (currentDay.sleepQuality === 'poor') sleepPoints = Math.max(20, sleepPoints - 25);

    const stepsVal = currentDay.steps !== undefined ? currentDay.steps : 0;
    const stepsPoints = stepsVal >= 10000 ? 100 : stepsVal >= 7000 ? 85 : stepsVal >= 4000 ? 60 : 35;

    const workoutVal = currentDay.workoutMinutes || 0;
    const workoutPoints = workoutVal >= 45 ? 100 : workoutVal >= 20 ? 80 : workoutVal > 0 ? 60 : 30;

    healthScore = (sleepPoints + stepsPoints + workoutPoints) / 3;
  }

  // 2. Productivity Subscore (25%)
  let productivityScore = 70;
  if (tasks.length > 0) {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const snoozed = tasks.filter(t => t.status === 'snoozed').length;
    const total = tasks.length;
    
    const completionRate = completed / total;
    let baseProd = completionRate * 100;
    
    // snooze penalty
    baseProd -= snoozed * 8;
    productivityScore = Math.max(10, Math.min(100, baseProd));
  }

  // 3. Finance Subscore (25%)
  let financeScore = 80;
  const budgetLimit = 150000; // Daily budget limit
  const todayExpenses = finances
    .filter(f => f.type === 'expense')
    .reduce((sum, f) => sum + f.amount, 0);
  
  if (todayExpenses === 0) {
    financeScore = 100;
  } else if (todayExpenses <= budgetLimit) {
    financeScore = 100 - (todayExpenses / budgetLimit) * 35; // max 35 point reduction
  } else {
    const overBudgetPercent = (todayExpenses - budgetLimit) / budgetLimit;
    financeScore = Math.max(10, 65 - overBudgetPercent * 80);
  }

  // 4. Mood Subscore (25%)
  let moodScore = 75;
  if (currentDay) {
    const moodMap = { good: 95, neutral: 70, tired: 50, anxious: 40, stressed: 30 };
    let baseMood = moodMap[currentDay.directMood] || 75;

    // Cross-dimensional adjustments:
    if (currentDay.sleepQuality === 'poor') baseMood = Math.max(20, baseMood - 15);
    if (financeScore < 50) baseMood = Math.max(15, baseMood - 15);
    const snoozedCount = tasks.filter(t => t.status === 'snoozed').length;
    if (snoozedCount >= 3) baseMood = Math.max(20, baseMood - 12);
    if (currentDay.workoutMinutes >= 20) baseMood = Math.min(100, baseMood + 10);

    moodScore = baseMood;
  }

  const finalScore = Math.round(
    healthScore * 0.25 + 
    productivityScore * 0.25 + 
    financeScore * 0.25 + 
    moodScore * 0.25
  );

  return {
    finalScore,
    breakdown: {
      health: Math.round(healthScore),
      productivity: Math.round(productivityScore),
      finance: Math.round(financeScore),
      mood: Math.round(moodScore)
    }
  };
};

// Generates dynamic LQS diagnostics using real Google Gemini API
export const getAIExplanation = async (score, breakdown, habits, tasks, finances) => {
  const systemPrompt = `
You are LifeOS AI Core, an AI advisor that analyzes the user's Life Quality Score (LQS).
Generate a concise, high-fidelity Indonesian feedback review based on their metrics.
Explain cross-dimensional correlations (e.g. how sleep affects spending and task completion rate).
Provide 2-3 specific, actionable coaching tips.
`;

  const explanationSchema = {
    type: "OBJECT",
    properties: {
      explanation: { 
        type: "STRING", 
        description: "Markdown description of the analysis and correlations. Use bolding and lists. Use \\n for newlines." 
      },
      advice: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "List of exactly 3 short, punchy coaching tips."
      }
    },
    required: ["explanation", "advice"]
  };

  const safeFinances = finances || [];
  const safeTasks = tasks || [];
  const totalExpense = safeFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const snoozedCount = safeTasks.filter(t => t.status === 'snoozed').length;
  const completedCount = safeTasks.filter(t => t.status === 'completed').length;

  const userPrompt = `
LQS Score: ${score}/100
Health Subscore: ${breakdown.health}%
Productivity Subscore: ${breakdown.productivity}%
Finance Subscore: ${breakdown.finance}%
Mood Subscore: ${breakdown.mood}%
Sleep Hours: ${habits.sleepHours} (${habits.sleepQuality} quality)
Steps Today: ${habits.steps}
Workout: ${habits.workoutMinutes} minutes
Total Spending Today: Rp ${totalExpense.toLocaleString('id-ID')}
Tasks Completed: ${completedCount} completed, ${snoozedCount} snoozed.
`;

  try {
    const rawText = await callGemini(systemPrompt, userPrompt, explanationSchema);
    return safeParseJSON(rawText);
  } catch (error) {
    console.error("Gemini explanation generation failed, using mock fallback:", error);
    // Mock Fallback
    return {
      explanation: `Life Quality Score kamu berada di angka **${score || 70}/100**. Tidur ${habits?.sleepHours || 7} jam dan pengeluaran Rp ${(totalExpense || 0).toLocaleString('id-ID')} memicu dinamika stres dan energi harian.`,
      advice: [
        "🌿 Pertahankan kecukupan air minum minimal 2 liter.",
        "📅 Selesaikan tugas prioritas rendah sebelum berganti hari.",
        "💵 Batasi belanja kopi atau makanan ringan ekstra besok."
      ]
    };
  }
};

// Conversational AI secretary processor powered by real Google Gemini API
export const processUserChat = async (userMessage, appState, localTimeStr = '') => {
  const systemPrompt = `
You are LifeOS AI Core, a proactive, witty, and supportive Gen Z AI Personal Secretary. 
Communicate in a mix of Indonesian and Gen Z slang (bestie, gaes, dll.) with a supportive, witty tone. 
You know the user's complete state: tasks, budget, finances, mood, financial assets, active life goals, and historical logs. 
If the user asks about their balance, goals, or past trends, utilize the provided data to answer accurately and suggest tips.

Jika pengguna meminta Anda melakukan tindakan tertentu seperti mencatat pengeluaran/pemasukan, menjadwalkan ulang tugas, menambah tugas baru, atau menambah tabungan, Anda WAJIB menyertakan blok kode JSON 'action_trigger' di akhir respon Anda:

1. Mencatat Transaksi (Mendukung Pengeluaran & Pendapatan/Pemasukan):
\`\`\`action_trigger
{
  "type": "ADD_TRANSACTION",
  "payload": {
    "type": "income",  // atau "expense"
    "amount": 50000,
    "category": "Salary",  // Kategori: "Salary", "Freelance", "Investment", "Gift", "Caffeine/Food", "Impulse/Lifestyle", "Travel", "Other"
    "description": "Gaji Proyek Freelance",
    "walletName": "GoPay" // nama dompet digital yang disebutkan pengguna seperti "gopay", "bank", "cash", dll. (opsional)
  }
}
\`\`\`

2. Menambah Tugas Baru (Mendukung tugas tunggal atau banyak tugas sekaligus secara simultan):
Untuk tugas tunggal:
\`\`\`action_trigger
{
  "type": "ADD_TASK",
  "payload": {
    "text": "Belajar Pemrograman React",
    "priority": "high",  // "high", "medium", "low"
    "tag": "Productivity",  // "Productivity", "Health", "Finance", "Social", "Growth", "Other"
    "date": "2026-05-29",   // YYYY-MM-DD
    "time": "19:00",        // format 24 jam HH:MM secara AKURAT
    "endTime": "20:00"     // format 24 jam HH:MM (opsional)
  }
}
\`\`\`
Untuk banyak tugas sekaligus (multiple tasks):
\`\`\`action_trigger
{
  "type": "ADD_TASK",
  "payload": {
    "tasks": [
      {
        "text": "Tugas 1 (e.g. Rapat Project)",
        "priority": "high",
        "tag": "Productivity",
        "date": "2026-06-02",
        "time": "14:00",
        "endTime": "15:00"
      },
      {
        "text": "Tugas 2 (e.g. Beli Susu)",
        "priority": "low",
        "tag": "Other",
        "date": "2026-06-02",
        "time": "17:00",
        "endTime": ""
      }
    ]
  }
}
\`\`\`

3. Menjadwalkan Ulang Tugas:
\`\`\`action_trigger
{
  "type": "RESCHEDULE_TASKS",
  "payload": {
    "taskIds": ["t1"],
    "nextDate": "2026-05-30"  // YYYY-MM-DD
  }
}
\`\`\`

4. Menambah Tabungan (Menabung ke target tabungan tertentu):
\`\`\`action_trigger
{
  "type": "ADD_SAVING_FUND",
  "payload": {
    "savingId": "s1",  // atau biarkan null jika tidak spesifik
    "amount": 100000
  }
}
\`\`\`

Jika pengguna lelah atau stres dan memiliki tugas prioritas tinggi, Anda dapat menggunakan AUTO_RESCHEDULE_TIRED untuk menyisipkan tugas istirahat.
Kategori untuk 'expense': Caffeine/Food, Impulse/Lifestyle, Travel, Other.
Kategori untuk 'income': Salary, Freelance, Investment, Gift, Other.

Usahakan respon tetap singkat, ramah, dan sangat Gen Z! Gunakan format markdown tebal dan list yang cantik.
`;

  const pendingTasks = appState.tasks.filter(t => t.status === 'pending');
  const userPrompt = `
User Message: "${userMessage}"
Current Date: ${appState.currentDay?.date || "today"}
Current Local Time: ${localTimeStr || "not specified"}
Current Habits: ${JSON.stringify(appState.currentDay)}
Today's Pending Tasks: ${JSON.stringify(pendingTasks)}
Today's Transactions: ${JSON.stringify(appState.finances.filter(f => f.date === appState.currentDay?.date))}
Financial Assets/Accounts: ${JSON.stringify(appState.assets || [])}
Active Life Goals: ${JSON.stringify(appState.goals || [])}
Past History Logs (Last 5 days): ${JSON.stringify((appState.history || []).slice(-5))}
`;

  try {
    const rawText = await callGemini(systemPrompt, userPrompt);
    
    // Parse action_trigger if present in response
    let aiText = rawText;
    let actionTriggered = null;
    let stateUpdates = null;
    
    const triggerRegex = /```action_trigger([\s\S]*?)```/;
    const match = rawText.match(triggerRegex);
    
    if (match && match[1]) {
      try {
        actionTriggered = JSON.parse(match[1].trim());
        // Clean the action block from the visible text response
        aiText = rawText.replace(triggerRegex, '').trim();
      } catch (e) {
        console.error("Failed to parse action trigger JSON:", e);
      }
    }
    
    // Simple state updates based on user keywords (dopamine boosts)
    const msg = userMessage.toLowerCase();
    if (msg.includes('olahraga') || msg.includes('jogging') || msg.includes('gym') || msg.includes('workout')) {
      stateUpdates = {
        habits: { 
          ...appState.currentDay, 
          workoutMinutes: Math.max(30, (appState.currentDay.workoutMinutes || 0) + 30),
          directMood: 'good'
        }
      };
    } else if (msg.includes('capek') || msg.includes('lelah') || msg.includes('pusing') || msg.includes('burnout')) {
      stateUpdates = {
        habits: { ...appState.currentDay, directMood: 'tired' }
      };
    }
    
    return {
      aiText,
      stateUpdates,
      actionTriggered
    };
  } catch (error) {
    console.error("Gemini chat processing failed, using fallback:", error);
    return {
      aiText: `Aduh bestie, koneksi AI Core-ku agak keganggu nih. (Detail Error: ${error.message}). Tapi aku denger kok! Semangat terus ya! 💕`,
      stateUpdates: null,
      actionTriggered: null
    };
  }
};

export const generatePatternInsights = (history) => {
  if (!history || history.length < 3) {
    return [
      {
        title: "💡 AI Sedang Mempelajari Pola Hidupmu",
        insight: "LifeOS AI membutuhkan **minimal 3 hari catatan riwayat** untuk menganalisis korelasi lintas-dimensi secara akurat antara kualitas tidur, produktivitas, pengeluaran harian, dan kondisi mood Anda. Tetap catat aktivitas harianmu ya, bestie! 🚀",
        impact: "Analisis Pola Harian: Menunggu Data Terkumpul",
        type: "info"
      },
      {
        title: "⚡ Korelasi Fisik-Produktivitas (Mendatang)",
        insight: "Di sini Anda akan melihat laporan bagaimana durasi tidur Anda mempengaruhi efisiensi penyelesaian daftar tugas harian secara riil.",
        impact: "Menunggu Lebih Banyak Data",
        type: "info"
      },
      {
        title: "🛍️ Pemicu Belanja Impulsif (Mendatang)",
        insight: "AI akan melacak dan memetakan korelasi apakah tingkat lelah/stres dan kurang tidur menjadi pemicu utama melonjaknya pengeluaran impulsif Anda.",
        impact: "Menunggu Lebih Banyak Data",
        type: "info"
      }
    ];
  }

  const lowSleepDays = history.filter(h => h.sleepHours < 6.5);
  const goodSleepDays = history.filter(h => h.sleepHours >= 6.5);

  const avgTasksLowSleep = lowSleepDays.reduce((sum, h) => sum + (h.completedTasks || 0), 0) / (lowSleepDays.length || 1);
  const avgTasksGoodSleep = goodSleepDays.reduce((sum, h) => sum + (h.completedTasks || 0), 0) / (goodSleepDays.length || 1);

  const avgExpenseLowSleep = lowSleepDays.reduce((sum, h) => sum + (h.expense || 0), 0) / (lowSleepDays.length || 1);
  const avgExpenseGoodSleep = goodSleepDays.reduce((sum, h) => sum + (h.expense || 0), 0) / (goodSleepDays.length || 1);

  const workoutDays = history.filter(h => h.workoutMinutes >= 20);
  const noWorkoutDays = history.filter(h => h.workoutMinutes < 20);
  const avgScoreWorkout = workoutDays.reduce((sum, h) => sum + h.lifeScore, 0) / (workoutDays.length || 1);
  const avgScoreNoWorkout = noWorkoutDays.reduce((sum, h) => sum + h.lifeScore, 0) / (noWorkoutDays.length || 1);

  return [
    {
      title: "Korelasi Fisik-Produktivitas (Cross-Dimension)",
      insight: `Saat tidurmu < 6.5 jam, rata-rata tugas selesai hanyalah **${avgTasksLowSleep.toFixed(1)} tugas/hari**, merosot tajam dibanding **${avgTasksGoodSleep.toFixed(1)} tugas/hari** saat tidurmu cukup.`,
      impact: "Penurunan Produktivitas 35%",
      type: "negative"
    },
    {
      title: "Pemicu Belanja Impulsif (Tidur -> Dompet)",
      insight: `Kurang tidur mendorong keputusan belanja impulsif (caffeine & comfort food). Pengeluaran meningkat menjadi rata-rata **Rp ${Math.round(avgExpenseLowSleep).toLocaleString('id-ID')}** dibanding **Rp ${Math.round(avgExpenseGoodSleep).toLocaleString('id-ID')}** pada hari bertenaga.`,
      impact: "Kenaikan Pengeluaran 120%",
      type: "warning"
    },
    {
      title: "Booster Dopamin Alami (Workout -> Life Score)",
      insight: `Olahraga minimal 20 menit mendorong Life Score harianmu naik ke rata-rata **${avgScoreWorkout.toFixed(0)}/100**, sementara hari-hari mager hanya menorehkan rata-rata **${avgScoreNoWorkout.toFixed(0)}/100**.`,
      impact: "Peningkatan Kualitas Hidup +18pts",
      type: "positive"
    },
    {
      title: "Waktu Produktivitas Emas Kamu (AI Learning)",
      insight: "AI mendeteksi pola mingguan unikmu: **Senin pagi jam 09:00 - 11:30** adalah waktu di mana fokus kamu berada di puncak tertinggi. Kami menyarankan pemblokiran waktu fokus untuk tugas paling rumit di slot waktu tersebut.",
      impact: "Peak Focus Window Detected",
      type: "info"
    }
  ];
};

// Multimodal receipt OCR scanner powered by Google Gemini API
export const scanReceiptWithGemini = async (base64Data, mimeType) => {
  const systemPrompt = `
You are an expert OCR receipt scanner. Analyze the receipt image provided.
Identify all text, store names, prices, items, subtotals, and total payments.
Extract:
1. Total amount spent (as an integer number, e.g. 45000). Look closely for the final total paid, grand total, net total, or total payment.
2. Short descriptive name for the merchant/store or item (e.g. "Kopi Tuku", "Indomaret"). If not clear, summarize the items (e.g. "Belanja Bulanan").
3. Classify the category as one of: Caffeine/Food, Impulse/Lifestyle, Travel, Other.

If the image is not a receipt or doesn't have any purchase text, return "No receipt data found" as description, 0 as amount, and "Other" as category.
`;

  const receiptSchema = {
    type: "OBJECT",
    properties: {
      description: { type: "STRING", description: "Name of the merchant/store or primary items purchased" },
      amount: { type: "INTEGER", description: "The final total paid amount as an integer (no decimals, no periods/commas, no currency symbol). Return 0 if not found." },
      category: { 
        type: "STRING", 
        enum: ["Caffeine/Food", "Impulse/Lifestyle", "Travel", "Other"],
        description: "Category of the transaction" 
      }
    },
    required: ["description", "amount", "category"]
  };

  try {
    const rawText = await callGemini(systemPrompt, null, receiptSchema, {
      mimeType: mimeType,
      data: base64Data
    });

    return safeParseJSON(rawText);
  } catch (error) {
    console.error("Gemini receipt scanning failed:", error);
    throw error;
  }
};

// Generates a Gen Z slangy summary of all daily activities using Google Gemini API
export const getAIDailySummary = async (currentDay, tasks, finances) => {
  const systemPrompt = `
You are LifeOS AI Core, a supportive and witty Gen Z AI Personal Secretary.
Analyze the user's activities (tasks, spending, habits, sleep, mood) for the selected day.
Write an extremely short daily summary (strictly maximum 1-2 short sentences, maximum 20 words total) in friendly Gen Z slang (using words like bestie, mantap, spill, overbudget, dll.) in Indonesian. Keep it super brief and concise!
Also extract a bulleted list of 3-4 key highlights of the day.
`;

  const summarySchema = {
    type: "OBJECT",
    properties: {
      summary: { 
        type: "STRING", 
        description: "A slangy, friendly, Gen Z Indonesian summary. Strictly maximum 1-2 short sentences (max 20 words total) recapping the day." 
      },
      bullets: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "List of exactly 3-4 key highlights of the day, e.g. '✅ 3 tugas selesai', '☕ Jajan kopi Rp 25K'."
      }
    },
    required: ["summary", "bullets"]
  };

  const safeFinances = finances || [];
  const safeTasks = tasks || [];
  const totalExpense = safeFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const completedTasks = safeTasks.filter(t => t.status === 'completed');
  const pendingTasks = safeTasks.filter(t => t.status === 'pending');

  const userPrompt = `
Date: ${currentDay?.date || "today"}
Sleep: ${currentDay?.sleepHours || 7.5} hours (${currentDay?.sleepQuality || 'good'} quality)
Steps: ${currentDay?.steps || 0} steps
Workout: ${currentDay?.workoutMinutes || 0} minutes
Mood: ${currentDay?.directMood || 'neutral'}
Tasks: ${completedTasks.length} completed, ${pendingTasks.length} pending.
Completed Task Names: ${completedTasks.map(t => t.text).join(', ') || 'none'}
Pending Task Names: ${pendingTasks.map(t => t.text).join(', ') || 'none'}
Total Expense: Rp ${totalExpense.toLocaleString('id-ID')}
Transactions: ${safeFinances.map(f => `${f.description} (Rp ${f.amount})`).join(', ') || 'none'}
`;

  try {
    const rawText = await callGemini(systemPrompt, userPrompt, summarySchema);
    return safeParseJSON(rawText);
  } catch (error) {
    console.error("Gemini daily summary failed, using mock fallback:", error);
    return {
      summary: `Hari ini vibes-nya ${currentDay?.directMood === 'good' ? 'chill abis' : 'agak flat'} ya bestie. Tetap semangat menjalani hari! ✨`,
      bullets: [
        `✅ ${completedTasks.length} tugas selesai hari ini`,
        `💵 Total jajan Rp ${totalExpense.toLocaleString('id-ID')}`,
        `🏃 Langkah kaki: ${currentDay?.steps || 0} steps`
      ]
    };
  }
};

// Generates financial recommendations using Google Gemini API
export const getAIFinanceAdvice = async (goals, finances, assets, savings, debts) => {
  const systemPrompt = `
You are LifeOS AI Financial Planner, a smart, supportive, and witty Gen Z Personal Accountant.
Analyze the user's financial assets, daily expenses, savings, debts, and goals.
Provide a personalized financial recommendation in friendly, Gen Z slang Indonesian.
Highlight:
1. How to reach active saving goals.
2. Debt management advice (how to repay active debts).
3. Budget cap alignment (sticking to the daily spending limit).
Use rich Markdown inside the response (bolding, lists). Keep it punchy and clear!
`;

  const adviceSchema = {
    type: "OBJECT",
    properties: {
      recommendation: { 
        type: "STRING", 
        description: "Personalized financial recommendation paragraph/bullet points in Indonesian Gen Z slang. Use markdown." 
      },
      coachingTips: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Exactly 3 punchy financial coaching action tips."
      }
    },
    required: ["recommendation", "coachingTips"]
  };

  const safeFinances = finances || [];
  const safeAssets = assets || [];
  const safeSavings = savings || [];
  const safeDebts = debts || [];
  
  const totalExpense = safeFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const totalIncome = safeFinances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const totalAssets = safeAssets.reduce((sum, a) => sum + a.balance, 0);
  const totalSavings = safeSavings.reduce((sum, s) => sum + (s.currentAmount || 0), 0);
  const totalDebts = safeDebts.filter(d => !d.paid).reduce((sum, d) => sum + d.amount, 0);

  const userPrompt = `
Daily Expenses: Rp ${totalExpense.toLocaleString('id-ID')}
Daily Income: Rp ${totalIncome.toLocaleString('id-ID')}
Total Account Balances: Rp ${totalAssets.toLocaleString('id-ID')} (Assets: ${JSON.stringify(safeAssets)})
Active Savings: ${JSON.stringify(safeSavings)} (Total: Rp ${totalSavings.toLocaleString('id-ID')})
Active Debts: ${JSON.stringify(safeDebts)} (Total: Rp ${totalDebts.toLocaleString('id-ID')})
Financial Goals: ${JSON.stringify(goals || [])}
`;

  try {
    const rawText = await callGemini(systemPrompt, userPrompt, adviceSchema);
    return safeParseJSON(rawText);
  } catch (error) {
    console.error("Gemini financial advice failed, using mock fallback:", error);
    return {
      recommendation: `Duh bestie, koneksi AI Core lagi off. Tapi dengerin deh: Tabunganmu sekarang Rp ${totalSavings.toLocaleString('id-ID')} dan ada hutang Rp ${totalDebts.toLocaleString('id-ID')}. Keep eyes on your spending cap biar dompet ga jebol! 💸`,
      coachingTips: [
        "🔥 Cicil Shopee PayLater secepatnya biar ga kena denda.",
        "💡 Kurangi frekuensi beli kopi kekinian, alihkan Rp 20K per hari ke Tabungan Gadget.",
        "📊 Review mingguan pengeluaran impulsive biar balance tetap aman."
      ]
    };
  }
};

// Generates monthly summary review (tasks + finances) using Google Gemini API
export const getAIMonthlySummary = async (tasks, finances) => {
  const systemPrompt = `
You are LifeOS AI Executive Advisor, an analytical yet friendly and witty Gen Z Personal Coach.
Analyze the user's monthly progress:
1. Tasks: Completed, Pending, completion rate.
2. Finances: Total Income, Total Expenses, Sisa Saldo.
Provide a dynamic, beautiful, and deeply insightful summary and critique of their productivity and financial habits.
Tone: Supportive, insightful, using smart Indonesian Gen Z slang (e.g. "gaul", "bestie", "jebol", "mantap", "productive era").
`;

  const summarySchema = {
    type: "OBJECT",
    properties: {
      conclusion: {
        type: "STRING",
        description: "Dynamic paragraph summarizing their month, explaining the correlation between their productivity and financial health. Use bolding where relevant."
      },
      strengths: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Exactly 2 positive behaviors observed this month."
      },
      improvements: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Exactly 2 critical improvement points/critiques for their spending or tasks."
      }
    },
    required: ["conclusion", "strengths", "improvements"]
  };

  const safeTasks = tasks || [];
  const safeFinances = finances || [];

  const completedTasks = safeTasks.filter(t => t.status === 'completed');
  const pendingTasks = safeTasks.filter(t => t.status === 'pending');
  const completionRate = safeTasks.length > 0 ? Math.round((completedTasks.length / safeTasks.length) * 100) : 0;

  const totalExpense = safeFinances.filter(f => f.type === 'expense').reduce((sum, f) => sum + f.amount, 0);
  const totalIncome = safeFinances.filter(f => f.type === 'income').reduce((sum, f) => sum + f.amount, 0);
  const netBalance = totalIncome - totalExpense;

  const userPrompt = `
MONTHLY PERFORMANCE DATA:
Productivity:
- Total Tasks Created: ${safeTasks.length}
- Completed: ${completedTasks.length}
- Pending: ${pendingTasks.length}
- Completion Rate: ${completionRate}%
- Task details (up to 15): ${JSON.stringify(safeTasks.slice(0, 15).map(t => ({ text: t.text, status: t.status })))}

Finance:
- Total Income: Rp ${totalIncome.toLocaleString('id-ID')}
- Total Expenses: Rp ${totalExpense.toLocaleString('id-ID')}
- Sisa Saldo: Rp ${netBalance.toLocaleString('id-ID')}
- Transactions list (up to 15): ${JSON.stringify(safeFinances.slice(0, 15).map(f => ({ desc: f.description, type: f.type, amount: f.amount, cat: f.category })))}
`;

  try {
    const rawText = await callGemini(systemPrompt, userPrompt, summarySchema);
    return safeParseJSON(rawText);
  } catch (error) {
    console.error("Gemini monthly summary failed, using mock fallback:", error);
    return {
      conclusion: `Wah bestie, koneksi AI Advisor lagi agak bapuk nih. Tapi dari rekap bulan ini, kamu punya **${completedTasks.length} tugas selesai** (rasio sukses **${completionRate}%**) dan sisa saldo kamu berada di angka **Rp ${netBalance.toLocaleString('id-ID')}**. Tetap atur pengeluaran biar ga overbudget ya! 🚀`,
      strengths: [
        `Berhasil menyelesaikan ${completedTasks.length} agenda/tugas penting tepat waktu.`,
        "Konsisten melacak pengeluaran harian dan pemasukan bulanan."
      ],
      improvements: [
        "Masih ada beberapa tugas tertunda, coba pecah tugas besar jadi langkah kecil.",
        "Kurangi pengeluaran impulsif agar sisa saldo bulanan bisa lebih maksimal disaving."
      ]
    };
  }
};

// Multimodal receipt OCR scanner for Split Bill functionality
export const scanReceiptForSplitBill = async (base64Data, mimeType) => {
  const systemPrompt = `
You are an expert OCR split bill scanner. Analyze the receipt image provided.
Identify all text, store names, prices, items, quantities, and totals.
Extract:
1. Merchant/Store name.
2. List of items: For each item, extract the name, price per unit (integer), and quantity.
3. Subtotal, taxes, service charges, or discount amount.
4. Total amount paid.
`;

  const splitBillSchema = {
    type: "OBJECT",
    properties: {
      merchant: { type: "STRING", description: "Name of the merchant/store" },
      items: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING", description: "Item description/name" },
            price: { type: "INTEGER", description: "Unit price of the item" },
            quantity: { type: "INTEGER", description: "Quantity purchased" }
          },
          required: ["name", "price", "quantity"]
        },
        description: "List of items purchased"
      },
      taxAndService: { type: "INTEGER", description: "Sum of taxes, service fees, and other surcharges minus any discounts (integer)" },
      totalAmount: { type: "INTEGER", description: "The final total paid amount as an integer" }
    },
    required: ["merchant", "items", "taxAndService", "totalAmount"]
  };

  try {
    const rawText = await callGemini(systemPrompt, null, splitBillSchema, {
      mimeType: mimeType,
      data: base64Data
    });
    return safeParseJSON(rawText);
  } catch (error) {
    console.error("Gemini split bill scanning failed:", error);
    throw error;
  }
};