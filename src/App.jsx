import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  CheckSquare, 
  Plus, 
  DollarSign, 
  Activity, 
  TrendingUp, 
  Moon, 
  Sun,
  X,
  Clock,
  ArrowDownRight,
  ArrowUpRight,
  Sparkles,
  CreditCard,
  Target,
  Droplet,
  Bell,
  Video,
  Flame,
  Leaf,
  Check
} from 'lucide-react';

import Header from './components/Header';
import Dashboard from './components/Dashboard';
import CalendarWidget from './components/CalendarWidget';
import TasksManager from './components/TasksManager';
import FinanceManager from './components/FinanceManager';
import HabitsManager from './components/HabitsManager';
import InsightsManager from './components/InsightsManager';
import AiChatCompanion from './components/AiChatCompanion';
import AssetsManager from './components/AssetsManager';
import GoalsManager from './components/GoalsManager';
import ProfileManager from './components/ProfileManager';
import GrowthGarden from './components/GrowthGarden';
import AuthScreen from './components/AuthScreen';
import { startFocusSound, stopFocusSound } from './utils/focusSynth';
import { isSupabaseConfigured, pullUserData, pushUserData } from './utils/supabaseClient';
import { checkPrismaReachable, pullUserDataPrisma, pushUserDataPrisma } from './utils/prismaClient';

import { 
  calculateLifeScore, 
  getAIExplanation, 
  processUserChat, 
  generatePatternInsights, 
  getSeededHistory,
  getAIDailySummary,
  getAIFinanceAdvice
} from './utils/aiEngine';

// Default tasks mapped to March 2026 dates (matching calendar)
const INITIAL_TASKS = [];

// Preloaded finances mapped to dates
const INITIAL_FINANCES = [];

// Base initial fallback context parameters
const INITIAL_CURRENT_DAY = {
  sleepHours: 7,
  sleepQuality: 'good',
  steps: 0,
  workoutMinutes: 0,
  waterIntake: 0,
  directMood: 'neutral',
  date: ''
};

const formatMarkdownToHtml = (text) => {
  if (!text) return '';
  
  // Normalize double-escaped \n and real newlines
  let processed = text.replace(/\\n/g, '\n');
  
  // Convert headers (e.g. ### Header)
  processed = processed.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  processed = processed.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  processed = processed.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Convert bold **text**
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Convert italic *text*
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert list bullets
  let lines = processed.split('\n');
  let inList = false;
  let htmlLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      const content = trimmed.substring(2);
      let prefix = '';
      if (!inList) {
        inList = true;
        prefix = '<ul style="margin-left: 1.2rem; margin-top: 0.4rem; margin-bottom: 0.4rem; list-style-type: disc;">';
      }
      return `${prefix}<li style="margin-bottom: 0.25rem; font-size: 0.8rem; color: var(--text-secondary);">${content}</li>`;
    } else {
      let prefix = '';
      if (inList) {
        inList = false;
        prefix = '</ul>';
      }
      return prefix + (trimmed ? `<p style="margin-bottom: 0.5rem; font-size: 0.8rem; line-height: 1.45; color: var(--text-secondary);">${trimmed}</p>` : '');
    }
  });
  
  if (inList) {
    htmlLines.push('</ul>');
  }
  
  return htmlLines.join('');
};

export default function App() {
  // --- Dynamic Multi-User Session ID & Email ---
  const [userId, setUserId] = useState(() => {
    try {
      return localStorage.getItem('lifeos_user_id') || '';
    } catch (e) {
      return '';
    }
  });

  const [userEmail, setUserEmail] = useState(() => {
    try {
      return localStorage.getItem('lifeos_user_email') || '';
    } catch (e) {
      return '';
    }
  });

  // --- State Stores ---
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_theme');
      return saved ? saved : 'light-theme';
    } catch(e) {
      return 'light-theme';
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_history');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(item => item && typeof item === 'object' && item.date && item.sleepHours !== undefined);
          if (valid.length > 0) return valid;
        }
      }
    } catch(e) {}
    return [];
  });

  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_assets');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [
      { id: 'cash', name: 'Tunai / Cash', balance: 500000 },
      { id: 'gopay', name: 'GoPay', balance: 250000 },
      { id: 'bank', name: 'Rekening Bank', balance: 2000000 }
    ];
  });

  const [goals, setGoals] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_goals');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [];
  });

  const [savings, setSavings] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_savings');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch(e) {}
    return [];
  });

  const [debts, setDebts] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_debts');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch(e) {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_savings', JSON.stringify(savings));
    } catch(e){}
  }, [savings]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_debts', JSON.stringify(debts));
    } catch(e){}
  }, [debts]);

  const [userProfile, setUserProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_user_profile');
      if (saved && saved !== 'undefined') return JSON.parse(saved);
    } catch(e) {}
    return {
      name: 'User LifeOS',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
      bio: 'Mengelola hidup lebih teratur dengan LifeOS ✨'
    };
  });

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_user_profile', JSON.stringify(userProfile));
    } catch(e){}
  }, [userProfile]);

  const [focusTask, setFocusTask] = useState(null);
  const [txnAssetId, setTxnAssetId] = useState('cash');

  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  });

  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  const [currentDay, setCurrentDay] = useState(() => {
    const todayStr = (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();

    try {
      const saved = localStorage.getItem('lifeos_current_day');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.sleepHours !== undefined) {
          if (parsed.date === todayStr) {
            return parsed;
          }
        }
      }
    } catch(e) {}
    return { ...INITIAL_CURRENT_DAY, date: todayStr };
  });

  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_tasks');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(t => t && typeof t === 'object' && t.id && t.text && t.status);
          if (valid.length > 0) return valid;
        }
      }
    } catch(e) {}
    return INITIAL_TASKS;
  });

  const [finances, setFinances] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_finances');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(f => f && typeof f === 'object' && f.id && f.amount !== undefined);
          if (valid.length > 0) return valid;
        }
      }
    } catch(e) {}
    return INITIAL_FINANCES;
  });

  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_chat_history');
      if (saved && saved !== 'undefined') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(c => c && typeof c === 'object' && c.sender && c.text);
          if (valid.length > 0) return valid;
        }
      }
    } catch(e) {}
    return [
      {
        id: 'msg_welcome',
        sender: 'ai',
        text: 'Halo! Aku **LifeOS AI Core**, sekretaris pribadi berbasis AI-mu. 🌌\n\nAda yang mau kamu ceritakan tentang mood, aktivitas, atau rencana jajanmu hari ini? Ketik saja, biar aku log dan selaraskan jadwalmu otomatis!',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });

  // --- UI Screen View Controller ---
  const [activeScreen, setActiveScreen] = useState('dashboard');
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [showAiDiagnosisModal, setShowAiDiagnosisModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  // Focus Timer States
  const [timerTime, setTimerTime] = useState(1500); 
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerType, setTimerType] = useState('focus'); 
  const [ambientSound, setAmbientSound] = useState('rain'); 

  // Input states
  const [chatInput, setChatInput] = useState('');
  const [taskText, setTaskText] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskTag, setTaskTag] = useState('Productivity');
  const [taskTime, setTaskTime] = useState('');
  const [taskEndTime, setTaskEndTime] = useState('');
  const [taskDate, setTaskDate] = useState(selectedDate);
  const [taskLink, setTaskLink] = useState('');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const subpanels = document.querySelectorAll('.subpanel-overlay, div, section');
    subpanels.forEach(el => {
      if (el.scrollTop > 0) {
        el.scrollTop = 0;
      }
    });
  }, [activeScreen]);

  // Browser History Navigation (Back Button Support)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || 'dashboard';
      if (hash === 'chat') {
        setAiChatOpen(true);
      } else {
        setAiChatOpen(false);
        const validScreens = ['dashboard', 'tasks', 'finance', 'assets', 'goals', 'habits', 'insights', 'profile'];
        if (validScreens.includes(hash)) {
          setActiveScreen(hash);
        }
      }
    };

    // Check initial hash
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash === 'chat') {
      setAiChatOpen(true);
    } else if (initialHash) {
      const validScreens = ['dashboard', 'tasks', 'finance', 'assets', 'goals', 'habits', 'insights', 'profile'];
      if (validScreens.includes(initialHash)) {
        setActiveScreen(initialHash);
      }
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash based on screen / chat states
  useEffect(() => {
    const currentHash = window.location.hash.replace('#', '');
    if (aiChatOpen) {
      if (currentHash !== 'chat') {
        window.location.hash = 'chat';
      }
    } else {
      const targetHash = activeScreen === 'dashboard' ? '' : activeScreen;
      if (currentHash !== targetHash && currentHash !== 'chat') {
        window.location.hash = targetHash;
      }
    }
  }, [activeScreen, aiChatOpen]);

  useEffect(() => {
    setTaskDate(selectedDate);
  }, [selectedDate]);

  const [currentTimeState, setCurrentTimeState] = useState(new Date());
  const notifiedTasksRef = useRef(new Set());

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const checkReminders = () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      
      const now = new Date();
      const currentHrs = now.getHours().toString().padStart(2, '0');
      const currentMins = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${currentHrs}:${currentMins}`;
      
      // Get local date string YYYY-MM-DD
      const systemYear = now.getFullYear();
      const systemMonth = (now.getMonth() + 1).toString().padStart(2, '0');
      const systemDay = now.getDate().toString().padStart(2, '0');
      const systemTodayStr = `${systemYear}-${systemMonth}-${systemDay}`;

      tasks.forEach(t => {
        if (t.status === 'pending' && t.dueDate === systemTodayStr && t.taskTime === currentTimeStr) {
          if (!notifiedTasksRef.current.has(t.id)) {
            notifiedTasksRef.current.add(t.id);
            try {
              new Notification("⏰ Pengingat Tugas LifeOS", {
                body: `Saatnya mengerjakan: "${t.text}" (Jadwal: ${t.taskTime})`,
                tag: t.id,
                requireInteraction: true
              });
            } catch (e) {
              console.error("Failed to trigger browser notification:", e);
            }
          }
        }
      });
    };

    // Initial check
    checkReminders();

    const clockTimer = setInterval(() => {
      const now = new Date();
      setCurrentTimeState(now);
      checkReminders();

      // Auto-update date and values at midnight / date change
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const todayStr = `${year}-${month}-${day}`;

      setSelectedDate(prevDate => {
        if (prevDate !== todayStr) {
          // Date has rolled over!
          // We must update the active selected date to todayStr.
          setCurrentDay(prevDay => {
            if (prevDay.date !== todayStr) {
              // Return new blank slate
              return {
                sleepHours: 7,
                sleepQuality: 'good',
                steps: 0,
                workoutMinutes: 0,
                waterIntake: 0,
                directMood: 'neutral',
                date: todayStr
              };
            }
            return prevDay;
          });
          return todayStr;
        }
        return prevDate;
      });
    }, 10000);
    
    return () => clearInterval(clockTimer);
  }, [tasks]);
  const [dailySummary, setDailySummary] = useState({
    summary: 'AI sedang menganalisis kegiatan hari ini... 🧠',
    bullets: ['Mengevaluasi agenda...']
  });

  const [aiSummariesCache, setAiSummariesCache] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_ai_summaries_cache');
      return saved ? JSON.parse(saved) : {};
    } catch(e) {
      return {};
    }
  });

  const [aiExplanationsCache, setAiExplanationsCache] = useState(() => {
    try {
      const saved = localStorage.getItem('lifeos_ai_explanations_cache');
      return saved ? JSON.parse(saved) : {};
    } catch(e) {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_ai_summaries_cache', JSON.stringify(aiSummariesCache));
    } catch(e) {}
  }, [aiSummariesCache]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_ai_explanations_cache', JSON.stringify(aiExplanationsCache));
    } catch(e) {}
  }, [aiExplanationsCache]);

  const getDayFingerprint = (dateVal, dayState, taskList, financeList) => {
    if (!dayState) return '';
    const dayTasks = taskList.filter(t => t.dueDate === dateVal).map(t => `${t.id}-${t.status}`).sort().join(',');
    const dayFinances = financeList.filter(f => f.date === dateVal).map(f => `${f.id}-${f.amount}-${f.type}`).sort().join(',');
    const sliders = JSON.stringify({
      sleepHours: dayState.sleepHours,
      sleepQuality: dayState.sleepQuality,
      steps: dayState.steps,
      workoutMinutes: dayState.workoutMinutes,
      waterIntake: dayState.waterIntake,
      directMood: dayState.directMood
    });
    return `tasks:${dayTasks}|finances:${dayFinances}|sliders:${sliders}`;
  };

  const [txnDesc, setTxnDesc] = useState('');
  const [txnAmount, setTxnAmount] = useState('');
  const [txnType, setTxnType] = useState('expense');
  const [txnCategory, setTxnCategory] = useState('Caffeine/Food');

  const chatBottomRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const lastPulledUserIdRef = useRef('');

  // GPS Tracking States & Helpers for Strava-style Tracker
  const [isTrackingGps, setIsTrackingGps] = useState(false);
  const [gpsDistance, setGpsDistance] = useState(0); // in km
  const [gpsSeconds, setGpsSeconds] = useState(0);
  const [gpsWatcherId, setGpsWatcherId] = useState(null);
  const lastCoordsRef = useRef(null);
  const gpsTimerRef = useRef(null);

  const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };

  const startGpsTracking = () => {
    if (!navigator.geolocation) {
      alert("Geolokasi tidak didukung oleh browser Anda.");
      return;
    }
    lastCoordsRef.current = null;
    setGpsDistance(0);
    setGpsSeconds(0);
    setIsTrackingGps(true);

    gpsTimerRef.current = setInterval(() => {
      setGpsSeconds(prev => prev + 1);
    }, 1000);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (lastCoordsRef.current) {
          const dist = calculateHaversineDistance(
            lastCoordsRef.current.latitude,
            lastCoordsRef.current.longitude,
            latitude,
            longitude
          );
          if (dist > 0.002) { // 2 meters threshold
            setGpsDistance(prev => prev + dist);
          }
        }
        lastCoordsRef.current = { latitude, longitude };
      },
      (error) => {
        console.error("GPS tracking error:", error);
      },
      { enableHighAccuracy: true, maximumAge: 1000 }
    );
    setGpsWatcherId(watchId);
  };

  const stopGpsTracking = () => {
    if (gpsWatcherId) {
      navigator.geolocation.clearWatch(gpsWatcherId);
      setGpsWatcherId(null);
    }
    if (gpsTimerRef.current) {
      clearInterval(gpsTimerRef.current);
      gpsTimerRef.current = null;
    }
    setIsTrackingGps(false);

    const calculatedSteps = Math.round(gpsDistance / 0.00075);
    const workoutMin = Math.round(gpsSeconds / 60);

    setCurrentDay(prev => ({
      ...prev,
      steps: (prev.steps || 0) + calculatedSteps,
      workoutMinutes: (prev.workoutMinutes || 0) + Math.max(1, workoutMin)
    }));

    alert(`Lari selesai! Anda berhasil menempuh ${gpsDistance.toFixed(2)} km, setara dengan ~${calculatedSteps} langkah, dalam ${workoutMin} menit.`);
  };

  // --- Calculations derived from selections ---
  const filteredTasks = tasks.filter(t => t.dueDate === selectedDate);
  const filteredFinances = finances.filter(f => f.date === selectedDate);

  const lifeScoreObj = calculateLifeScore(currentDay, filteredTasks, filteredFinances);
  const { finalScore, breakdown } = lifeScoreObj;

  const [aiExplanation, setAiExplanation] = useState({
    explanation: 'AI Core sedang memproses LQS hari ini... 🧠',
    advice: ['Mengevaluasi kondisi harian...']
  });

  // --- Sync to LocalStorage & Supabase ---
  useEffect(() => {
    try {
      localStorage.setItem('lifeos_theme', theme);
    } catch(e){}
  }, [theme]);

  // Database sync state
  const [isPrismaActive, setIsPrismaActive] = useState(false);
  const [dbLoading, setDbLoading] = useState(true);

  // Database Pull on Mount (Prisma priority -> Supabase -> LocalStorage)
  useEffect(() => {
    if (!userId) {
      setDbLoading(false);
      return;
    }
    setDbLoading(true);
    const initDb = async () => {
      const prismaReachable = await checkPrismaReachable();
      
      if (prismaReachable) {
        setIsPrismaActive(true);
        try {
          const dbData = await pullUserDataPrisma(userId);
          if (dbData) {
            const isDbEmpty = (!dbData.tasks || dbData.tasks.length === 0) &&
                               (!dbData.finances || dbData.finances.length === 0) &&
                               (!dbData.history || dbData.history.length === 0);
            
            const hasLocalData = tasks.length > 0 || finances.length > 0 || history.length > 0;

            if (isDbEmpty && hasLocalData) {
              const statePayload = {
                tasks,
                finances,
                currentDay,
                assets,
                savings,
                debts,
                history,
                chatHistory,
                userProfile
              };
              await pushUserDataPrisma(statePayload, userId);
            } else {
              if (dbData.tasks) setTasks(dbData.tasks);
              if (dbData.finances) setFinances(dbData.finances);
              if (dbData.currentDay) setCurrentDay(dbData.currentDay);
              if (dbData.assets) setAssets(dbData.assets);
              if (dbData.savings) setSavings(dbData.savings);
              if (dbData.debts) setDebts(dbData.debts);
              if (dbData.history) setHistory(dbData.history);
              if (dbData.chatHistory) setChatHistory(dbData.chatHistory);
              if (dbData.userProfile && Object.keys(dbData.userProfile).length > 0) setUserProfile(dbData.userProfile);
            }
          }
          lastPulledUserIdRef.current = userId;
        } catch (err) {
          console.error("Initial Prisma data pull failed:", err);
        }
      } else if (isSupabaseConfigured()) {
        try {
          const dbData = await pullUserData(userId);
          if (dbData) {
            const isDbEmpty = (!dbData.tasks || dbData.tasks.length === 0) &&
                               (!dbData.finances || dbData.finances.length === 0) &&
                               (!dbData.history || dbData.history.length === 0);
            
            const hasLocalData = tasks.length > 0 || finances.length > 0 || history.length > 0;

            if (isDbEmpty && hasLocalData) {
              const statePayload = {
                tasks,
                finances,
                currentDay,
                assets,
                savings,
                debts,
                history,
                chatHistory,
                userProfile
              };
              await pushUserData(statePayload, userId);
            } else {
              if (dbData.tasks) setTasks(dbData.tasks);
              if (dbData.finances) setFinances(dbData.finances);
              if (dbData.current_day) setCurrentDay(dbData.current_day);
              if (dbData.assets) setAssets(dbData.assets);
              if (dbData.savings) setSavings(dbData.savings);
              if (dbData.debts) setDebts(dbData.debts);
              if (dbData.history) setHistory(dbData.history);
              if (dbData.chat_history) setChatHistory(dbData.chat_history);
              if (dbData.user_profile && Object.keys(dbData.user_profile).length > 0) setUserProfile(dbData.user_profile);
            }
          }
          lastPulledUserIdRef.current = userId;
        } catch (err) {
          console.error("Initial Supabase data pull failed:", err);
        }
      }
      setDbLoading(false);
    };
    initDb();
  }, [userId]);

  // Database Auto Sync Debounced (Prisma priority -> Supabase)
  useEffect(() => {
    if (dbLoading || !userId || lastPulledUserIdRef.current !== userId) return;

    const delayDebounce = setTimeout(async () => {
      const statePayload = {
        tasks,
        finances,
        currentDay,
        assets,
        savings,
        debts,
        history,
        chatHistory,
        userProfile
      };

      if (isPrismaActive) {
        try {
          await pushUserDataPrisma(statePayload, userId);
        } catch (e) {
          console.warn("Prisma sync failed in background:", e);
        }
      } else if (isSupabaseConfigured()) {
        try {
          await pushUserData(statePayload, userId);
        } catch (e) {
          console.warn("Supabase sync failed in background:", e);
        }
      }
    }, 1500);

    return () => clearTimeout(delayDebounce);
  }, [tasks, finances, currentDay, assets, savings, debts, history, chatHistory, userProfile, dbLoading, isPrismaActive, userId]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_tasks', JSON.stringify(tasks));
    } catch(e){}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_finances', JSON.stringify(finances));
    } catch(e){}
  }, [finances]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_current_day', JSON.stringify(currentDay));
    } catch(e){}
  }, [currentDay]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_chat_history', JSON.stringify(chatHistory));
    } catch(e){}
  }, [chatHistory]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_history', JSON.stringify(history));
    } catch(e){}
  }, [history]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_assets', JSON.stringify(assets));
    } catch(e){}
  }, [assets]);

  useEffect(() => {
    try {
      localStorage.setItem('lifeos_goals', JSON.stringify(goals));
    } catch(e){}
  }, [goals]);

  // Audio synthesis trigger based on focus timer state
  useEffect(() => {
    if (timerRunning && ambientSound && ambientSound !== 'silent') {
      startFocusSound(ambientSound);
    } else {
      stopFocusSound();
    }
    return () => {
      stopFocusSound();
    };
  }, [timerRunning, ambientSound]);

  // Dynamically initialize selectedDate in history if not present
  useEffect(() => {
    let existingIndex = history.findIndex(h => h.date === selectedDate);
    if (existingIndex === -1) {
      const newDayObj = {
        date: selectedDate,
        sleepHours: 7.5,
        sleepQuality: 'good',
        steps: 0,
        workoutMinutes: 0,
        waterIntake: 1200,
        directMood: 'neutral',
        completedTasks: 0,
        snoozedTasks: 0,
        expense: 0,
        income: 0,
        lifeScore: 70
      };
      const updatedHistory = [...history, newDayObj];
      setHistory(updatedHistory);
      setSelectedDayIndex(updatedHistory.length - 1);
    } else {
      setSelectedDayIndex(existingIndex);
    }
  }, [selectedDate]);

  // Dynamic AI daily summary generator with caching & debouncing
  useEffect(() => {
    if (dbLoading || !userId) return;

    const currentFingerprint = getDayFingerprint(selectedDate, currentDay, tasks, finances);
    
    // Check if we have a valid summary in cache with matching fingerprint
    const cachedEntry = aiSummariesCache[selectedDate];
    if (cachedEntry && cachedEntry.fingerprint === currentFingerprint) {
      setDailySummary(cachedEntry.summary);
      return;
    }

    let active = true;
    const fetchSummary = async () => {
      try {
        const result = await getAIDailySummary(currentDay, filteredTasks, filteredFinances);
        if (active) {
          setDailySummary(result);
          // Save to cache
          setAiSummariesCache(prev => ({
            ...prev,
            [selectedDate]: {
              fingerprint: currentFingerprint,
              summary: result
            }
          }));
        }
      } catch (e) {
        console.error("AI daily summary request failed:", e);
      }
    };

    // Debounce the API call so rapid slider changes or navigating doesn't spam
    const delayDebounce = setTimeout(() => {
      fetchSummary();
    }, 1500);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [selectedDate, dbLoading, tasks, finances, currentDay, userId]);

  useEffect(() => {
    if (selectedDayIndex !== null && selectedDayIndex >= 0 && selectedDayIndex < history.length) {
      const todayExpense = filteredFinances
        .filter(f => f.type === 'expense')
        .reduce((sum, f) => sum + f.amount, 0);
      const todayIncome = filteredFinances
        .filter(f => f.type === 'income')
        .reduce((sum, f) => sum + f.amount, 0);
      const completed = filteredTasks.filter(t => t.status === 'completed').length;
      const snoozed = filteredTasks.filter(t => t.status === 'snoozed').length;

      const currentHist = history[selectedDayIndex];
      const hasChanged = 
        currentHist.sleepHours !== currentDay.sleepHours ||
        currentHist.sleepQuality !== currentDay.sleepQuality ||
        currentHist.steps !== currentDay.steps ||
        currentHist.workoutMinutes !== currentDay.workoutMinutes ||
        currentHist.waterIntake !== currentDay.waterIntake ||
        currentHist.directMood !== currentDay.directMood ||
        currentHist.completedTasks !== completed ||
        currentHist.snoozedTasks !== snoozed ||
        currentHist.expense !== todayExpense ||
        currentHist.income !== todayIncome ||
        currentHist.lifeScore !== finalScore;

      if (hasChanged) {
        setHistory(prev => prev.map((item, idx) => {
          if (idx === selectedDayIndex) {
            return {
              ...item,
              sleepHours: currentDay.sleepHours,
              sleepQuality: currentDay.sleepQuality,
              steps: currentDay.steps,
              workoutMinutes: currentDay.workoutMinutes,
              waterIntake: currentDay.waterIntake,
              directMood: currentDay.directMood,
              completedTasks: completed,
              snoozedTasks: snoozed,
              expense: todayExpense,
              income: todayIncome,
              lifeScore: finalScore
            };
          }
          return item;
        }));
      }
    }
  }, [currentDay, tasks, finances, finalScore, selectedDayIndex]);

  useEffect(() => {
    if (timerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerTime(prev => {
          if (prev <= 1) {
            setTimerRunning(false);
            clearInterval(timerIntervalRef.current);
            alert("⏰ Waktu Fokus Selesai! Saatnya istirahat sejenak, bestie.");
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerRunning]);

  // Dynamic LQS AI Explanation generator with caching & debouncing
  useEffect(() => {
    if (dbLoading || !userId) return;

    const currentFingerprint = getDayFingerprint(selectedDate, currentDay, tasks, finances);
    
    // Check if we have a valid explanation in cache with matching fingerprint
    const cachedEntry = aiExplanationsCache[selectedDate];
    if (cachedEntry && cachedEntry.fingerprint === currentFingerprint) {
      setAiExplanation(cachedEntry.explanation);
      return;
    }

    let active = true;
    const fetchExplanation = async () => {
      try {
        const result = await getAIExplanation(finalScore, breakdown, currentDay, filteredTasks, filteredFinances);
        if (active) {
          setAiExplanation(result);
          // Save to cache
          setAiExplanationsCache(prev => ({
            ...prev,
            [selectedDate]: {
              fingerprint: currentFingerprint,
              explanation: result
            }
          }));
        }
      } catch (e) {
        console.error("AI explanation request failed:", e);
        if (e.toString().includes('429') || e.toString().includes('Quota') || e.toString().includes('RESOURCE_EXHAUSTED')) {
          setIsQuotaExceeded(true);
        }
      }
    };

    // Debounce the API call so rapid slider changes or navigating doesn't spam
    const delayDebounce = setTimeout(() => {
      fetchExplanation();
    }, 1500);

    return () => {
      active = false;
      clearTimeout(delayDebounce);
    };
  }, [selectedDate, dbLoading, tasks, finances, currentDay, userId, finalScore, breakdown]);
  
  const insightsList = generatePatternInsights(history);

  // Gamified streak calculations
  const isStreakActive = filteredTasks.length > 0 && filteredTasks.every(t => t.status === 'completed');
  const getStreakCount = () => {
    let streak = 0;
    let currentDateObj = new Date(selectedDate);
    for (let i = 0; i < 30; i++) {
      const year = currentDateObj.getFullYear();
      const month = (currentDateObj.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDateObj.getDate().toString().padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      if (dayTasks.length > 0) {
        const allCompleted = dayTasks.every(t => t.status === 'completed');
        if (allCompleted) {
          streak++;
        } else {
          break; // streak broke
        }
      } else {
        const histDay = history.find(h => h.date === dateStr);
        if (histDay) {
          const completedCount = histDay.completedTasks || 0;
          const snoozedCount = histDay.snoozedTasks || 0;
          if (completedCount > 0 && snoozedCount === 0) {
            streak++;
          } else if (completedCount > 0 || snoozedCount > 0) {
            break; // streak broke
          }
        }
      }
      currentDateObj.setDate(currentDateObj.getDate() - 1);
    }
    return streak;
  };
  const streakCount = getStreakCount();

  // --- Calendar Day Navigator ---
  const handleSelectCalendarDay = (isSeededRange, index, dayNum, dateStr) => {
    setSelectedDate(dateStr);

    let existingIndex = history.findIndex(h => h.date === dateStr);
    let updatedHistory = [...history];

    if (existingIndex === -1) {
      const newDayObj = {
        date: dateStr,
        sleepHours: 7.5,
        sleepQuality: 'good',
        steps: 0,
        workoutMinutes: 0,
        waterIntake: 1200,
        directMood: 'neutral',
        completedTasks: 0,
        snoozedTasks: 0,
        expense: 0,
        income: 0,
        lifeScore: 70
      };
      updatedHistory.push(newDayObj);
      existingIndex = updatedHistory.length - 1;
      setHistory(updatedHistory);
    }

    setSelectedDayIndex(existingIndex);
    const dayData = updatedHistory[existingIndex];

    setCurrentDay({
      sleepHours: dayData.sleepHours || 7.5,
      sleepQuality: dayData.sleepQuality || 'good',
      steps: dayData.steps !== undefined ? dayData.steps : 0,
      workoutMinutes: dayData.workoutMinutes || 0,
      waterIntake: dayData.waterIntake || 1200,
      directMood: dayData.directMood || 'neutral',
      date: dateStr
    });

    if (isSeededRange && dayData.expense > 0) {
      const hasTxn = finances.some(f => f.date === dateStr);
      if (!hasTxn) {
        const mockTxn = {
          id: `txn_seed_${existingIndex}_${Date.now()}`,
          type: 'expense',
          amount: dayData.expense,
          category: 'Caffeine/Food',
          description: dayData.expense > 150000 ? 'Impulse Shopping Comfort' : 'Es Kopi & Jajanan Sore',
          timestamp: '16:00',
          date: dateStr
        };
        setFinances(prev => [mockTxn, ...prev]);
      }
    }

    if (isSeededRange) {
      setChatHistory(prev => [
        ...prev,
        {
          id: `ai_date_load_${Date.now()}`,
          sender: 'ai',
          text: `📅 **AI memuat data log tanggal ${dayNum} Maret 2026**: \n\nSkor kualitas hidup Anda hari ini adalah **${dayData.lifeScore}/100**.\n\n*Pola Lintas-Dimensi:* ${dayData.sleepHours < 6.2 ? 'Tidur pendek memicu penurunan fokus produktivitas (-30%) & impulsitas jajan.' : 'Istirahat cukup & olahraga meningkatkan momentum fokus Anda!'}`,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // --- Task Manager CRUD ---
  const handleAddTask = (e) => {
    e.preventDefault();
    if (!taskText.trim()) return;

    const newTask = {
      id: `task_${Date.now()}`,
      text: taskText,
      priority: taskPriority,
      tag: taskTag,
      status: 'pending',
      snoozeCount: 0,
      dueDate: taskDate || selectedDate,
      time: taskTime || '',
      endTime: taskEndTime || '',
      link: taskLink || ''
    };

    setTasks([...tasks, newTask]);
    setTaskText('');
    setTaskTime('');
    setTaskEndTime('');
    setTaskLink('');
  };

  const toggleTaskStatus = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t));
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const handleUpdateTask = (id, updatedFields) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, ...updatedFields } : t));
  };

  const handleSnoozeTask = (id) => {
    setTasks(tasks.map(t => {
      if (t.id === id) {
        const nextSnoozeCount = (t.snoozeCount || 0) + 1;
        if (nextSnoozeCount === 3) {
          setTimeout(() => {
            setAiChatOpen(true);
            setChatHistory(prev => [
              ...prev,
              {
                id: `ai_snooze_guilt_${Date.now()}`,
                sender: 'ai',
                text: `⚠️ **Productivity Guilt Alert!** \n\nKamu sudah tunda **"${t.text}"** 3 kali. \n\nAku mendeteksi burnout mental. Biar enteng, aku menyarankan kita **pecah tugas ini jadi 2 slot kerja kecil realistis** atau tunda total ke besok pagi. Setuju?`,
                timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                suggestedAction: {
                  type: 'RESOLVE_BURNOUT_SNOOZE',
                  payload: { taskId: t.id, taskText: t.text }
                }
              }
            ]);
          }, 300);
        }
        return { ...t, status: 'snoozed', snoozeCount: nextSnoozeCount };
      }
      return t;
    }));
  };

  // --- Assets Handlers ---
  const handleAddAsset = (name, balance) => {
    const newAsset = {
      id: `asset_${Date.now()}`,
      name,
      balance
    };
    setAssets([...assets, newAsset]);
  };

  const handleUpdateAssetBalance = (id, balance) => {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, balance } : a));
  };

  const handleDeleteAsset = (id) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  // --- Goals Handlers ---
  const handleAddGoal = (name, type, targetValue) => {
    const newGoal = {
      id: `goal_${Date.now()}`,
      name,
      type,
      targetValue
    };
    setGoals([...goals, newGoal]);
  };

  const handleDeleteGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleUpdateProfile = (newProfile) => {
    setUserProfile(newProfile);
    try {
      localStorage.setItem('lifeos_user_profile', JSON.stringify(newProfile));
    } catch (e) {}

    // Instant database sync for profile changes to prevent overwrite by initDb
    const statePayload = {
      tasks,
      finances,
      currentDay,
      assets,
      savings,
      debts,
      history,
      chatHistory,
      userProfile: newProfile
    };
    if (isPrismaActive) {
      pushUserDataPrisma(statePayload, userId).catch(err => console.warn("Prisma profile save failed:", err));
    } else if (isSupabaseConfigured()) {
      pushUserData(statePayload, userId).catch(err => console.warn("Supabase profile save failed:", err));
    }
  };

  const handleResetAllData = () => {
    if (confirm('Apakah Anda yakin ingin menghapus SEMUA data dan memulai ulang aplikasi? Semua data dummy akan dibersihkan.')) {
      try {
        localStorage.clear();
        window.location.reload();
      } catch (e) {
        console.error(e);
      }
    }
  };

  // --- Finance CRUD ---
  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!txnDesc.trim() || !txnAmount) return;

    const amountNum = parseFloat(txnAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const targetAssetId = assets.some(a => a.id === txnAssetId) 
      ? txnAssetId 
      : (assets.length > 0 ? assets[0].id : 'cash');

    const newTxn = {
      id: `txn_${Date.now()}`,
      type: txnType,
      amount: amountNum,
      category: txnCategory,
      description: txnDesc,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: selectedDate,
      assetId: targetAssetId
    };

    setFinances([newTxn, ...finances]);

    // Update asset balance
    setAssets(prev => prev.map(a => {
      if (a.id === targetAssetId) {
        return {
          ...a,
          balance: txnType === 'income' ? parseFloat(a.balance || 0) + amountNum : parseFloat(a.balance || 0) - amountNum
        };
      }
      return a;
    }));

    setTxnDesc('');
    setTxnAmount('');
  };

  const handleDeleteTransaction = (id) => {
    const txn = finances.find(f => f.id === id);
    if (!txn) return;
    
    // Revert asset balance
    setAssets(prev => prev.map(a => {
      if (a.id === txn.assetId) {
        return {
          ...a,
          balance: txn.type === 'income' ? parseFloat(a.balance || 0) - txn.amount : parseFloat(a.balance || 0) + txn.amount
        };
      }
      return a;
    }));
    
    setFinances(finances.filter(f => f.id !== id));
  };

  const handleUpdateTransaction = (id, updatedFields) => {
    const originalTxn = finances.find(f => f.id === id);
    if (!originalTxn) return;
    
    // Let's revert original asset balance impact, then apply new balance impact
    setAssets(prev => prev.map(a => {
      let balance = parseFloat(a.balance || 0);
      
      // Revert old impact if matching assetId
      if (a.id === originalTxn.assetId) {
        balance = originalTxn.type === 'income' ? balance - originalTxn.amount : balance + originalTxn.amount;
      }
      
      // Apply new impact if matching new assetId
      const newAssetId = updatedFields.assetId !== undefined ? updatedFields.assetId : originalTxn.assetId;
      const targetNewAssetId = assets.some(x => x.id === newAssetId) ? newAssetId : (assets.length > 0 ? assets[0].id : 'cash');
      const newType = updatedFields.type !== undefined ? updatedFields.type : originalTxn.type;
      const newAmount = updatedFields.amount !== undefined ? parseFloat(updatedFields.amount) : originalTxn.amount;
      
      if (a.id === targetNewAssetId) {
        balance = newType === 'income' ? balance + newAmount : balance - newAmount;
      }
      
      return { ...a, balance };
    }));
    
    setFinances(finances.map(f => f.id === id ? { ...f, ...updatedFields } : f));
  };

  const handleAddDirectTransaction = (desc, amount, type, category, assetId) => {
    const targetAssetId = assets.some(a => a.id === assetId) 
      ? assetId 
      : (assets.length > 0 ? assets[0].id : 'cash');
    const newTxn = {
      id: `txn_${Date.now()}`,
      type,
      amount,
      category,
      description: desc,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      date: selectedDate,
      assetId: targetAssetId
    };
    setFinances(prev => [newTxn, ...prev]);

    // Update asset balance
    setAssets(prev => prev.map(a => {
      if (a.id === targetAssetId) {
        return {
          ...a,
          balance: type === 'income' ? parseFloat(a.balance || 0) + amount : parseFloat(a.balance || 0) - amount
        };
      }
      return a;
    }));
  };

  // --- Accept AI Action ---
  const handleAcceptAIAction = (action) => {
    if (action.type === 'AUTO_RESCHEDULE_TIRED') {
      const { postponeIds, insertTask } = action.payload;
      setTasks(prev => prev.map(t => postponeIds.includes(t.id) ? { ...t, status: 'snoozed', snoozeCount: (t.snoozeCount || 0) + 1 } : t));
      const newRelax = {
        id: `task_${Date.now()}`,
        text: insertTask.text,
        priority: insertTask.priority,
        tag: insertTask.tag,
        status: insertTask.status,
        snoozeCount: 0,
        dueDate: selectedDate
      };
      setTasks(prev => [...prev, newRelax]);
    } else if (action.type === 'RESOLVE_BURNOUT_SNOOZE') {
      const { taskId, taskText } = action.payload;
      setTasks(prev => {
        const filtered = prev.filter(t => t.id !== taskId);
        const sub1 = {
          id: `task_sub1_${Date.now()}`,
          text: `🌱 (Pecahan AI Part 1) Buka & Draft Ringkasan: ${taskText.replace(/🔥|🏃|💵|📚/, '')}`,
          priority: 'low',
          tag: 'Productivity',
          status: 'pending',
          snoozeCount: 0,
          dueDate: selectedDate
        };
        const sub2 = {
          id: `task_sub2_${Date.now()}`,
          text: `🌱 (Pecahan AI Part 2) Kerjakan 1 Bagian Kecil: ${taskText.replace(/🔥|🏃|💵|📚/, '')}`,
          priority: 'medium',
          tag: 'Productivity',
          status: 'pending',
          snoozeCount: 0,
          dueDate: selectedDate
        };
        return [...filtered, sub1, sub2];
      });
    }
    setChatHistory(prev => prev.map(c => c.suggestedAction?.type === action.type ? { ...c, suggestedAction: null } : c));
  };

  // --- Send Chat Message ---
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: chatInput,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setChatHistory(prev => [...prev, userMsg]);
    const inputMsg = chatInput;
    setChatInput('');

    // Add typing placeholder
    const typingId = `ai_typing_${Date.now()}`;
    setChatHistory(prev => [...prev, {
      id: typingId,
      sender: 'ai',
      text: 'AI Core sedang mengetik... ⚡',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }]);

    const currentAppState = { tasks, currentDay, finances, assets, goals, history };

    try {
      const localTimeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      const response = await processUserChat(inputMsg, currentAppState, localTimeStr);
      const { aiText, stateUpdates, actionTriggered } = response;

      if (stateUpdates && stateUpdates.habits) {
        setCurrentDay(stateUpdates.habits);
      }

      setChatHistory(prev => {
        const filtered = prev.filter(c => c.id !== typingId);
        return [...filtered, {
          id: `ai_${Date.now()}`,
          sender: 'ai',
          text: aiText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          suggestedAction: actionTriggered
        }];
      });

      if (actionTriggered) {
        if (actionTriggered.type === 'ADD_EXPENSE') {
          const { amount, category, description, walletName } = actionTriggered.payload;
          let targetAssetId = assets && assets.length > 0 ? assets[0].id : 'cash';
          if (walletName) {
            const matchedAsset = assets.find(a => a.name.toLowerCase().includes(walletName.toLowerCase()));
            if (matchedAsset) {
              targetAssetId = matchedAsset.id;
            }
          }
          const newTxn = {
            id: `txn_${Date.now()}`,
            type: 'expense',
            amount,
            category,
            description,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            date: selectedDate,
            assetId: targetAssetId
          };
          setFinances(prev => [newTxn, ...prev]);
          setAssets(prev => prev.map(a => {
            if (a.id === targetAssetId) {
              return { ...a, balance: parseFloat(a.balance || 0) - amount };
            }
            return a;
          }));
        } else if (actionTriggered.type === 'ADD_TRANSACTION') {
          const { type, amount, category, description, walletName } = actionTriggered.payload;
          let targetAssetId = assets && assets.length > 0 ? assets[0].id : 'cash';
          if (walletName) {
            const matchedAsset = assets.find(a => a.name.toLowerCase().includes(walletName.toLowerCase()));
            if (matchedAsset) {
              targetAssetId = matchedAsset.id;
            }
          }
          const amountNum = parseFloat(amount);
          if (!isNaN(amountNum) && amountNum > 0) {
            const newTxn = {
              id: `txn_${Date.now()}`,
              type: type || 'expense',
              amount: amountNum,
              category: category || (type === 'income' ? 'Salary' : 'Caffeine/Food'),
              description: description || 'Transaksi AI ✨',
              timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
              date: selectedDate,
              assetId: targetAssetId
            };
            setFinances(prev => [newTxn, ...prev]);
            setAssets(prev => prev.map(a => {
              if (a.id === targetAssetId) {
                return {
                  ...a,
                  balance: type === 'income' ? parseFloat(a.balance || 0) + amountNum : parseFloat(a.balance || 0) - amountNum
                };
              }
              return a;
            }));
          }
        } else if (actionTriggered.type === 'ADD_TASK') {
          const { text, priority, tag, date, time, endTime } = actionTriggered.payload;
          const newTask = {
            id: `task_${Date.now()}`,
            text: text || 'Tugas Baru (Rekomendasi AI) 📝',
            priority: priority || 'medium',
            tag: tag || 'Productivity',
            status: 'pending',
            dueDate: date || selectedDate,
            time: time || '',
            endTime: endTime || '',
            snoozeCount: 0
          };
          setTasks(prev => [...prev, newTask]);
        } else if (actionTriggered.type === 'RESCHEDULE_TASKS') {
          const { taskIds, nextDate } = actionTriggered.payload;
          if (taskIds && nextDate) {
            setTasks(prev => prev.map(t => {
              if (taskIds.includes(t.id)) {
                return { ...t, dueDate: nextDate };
              }
              return t;
            }));
          }
        } else if (actionTriggered.type === 'ADD_SAVING_FUND') {
          const { savingId, amount } = actionTriggered.payload;
          const amountNum = parseFloat(amount);
          if (!isNaN(amountNum) && amountNum > 0) {
            setSavings(prev => prev.map(s => {
              if (s.id === savingId || (!savingId && prev.indexOf(s) === 0)) {
                return { ...s, currentAmount: (s.currentAmount || 0) + amountNum };
              }
              return s;
            }));
          }
        }
      }
    } catch (err) {
      console.error(err);
      if (err.toString().includes('429') || err.toString().includes('Quota') || err.toString().includes('RESOURCE_EXHAUSTED')) {
        setIsQuotaExceeded(true);
      }
      setChatHistory(prev => {
        const filtered = prev.filter(c => c.id !== typingId);
        return [...filtered, {
          id: `ai_error_${Date.now()}`,
          sender: 'ai',
          text: err.toString().includes('429')
            ? 'Aduh bestie, kuota harian Gemini-ku habis nih (Limit 20/hari). Coba ganti API key atau tunggu besok ya! 😢'
            : 'Maaf bestie, AI Core sedang mengalami gangguan koneksi. Coba tanyakan lagi ya! 😢',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }];
      });
    }
  };

  // Styling helper variable getters
  const getGlowColor = (score) => {
    if (score >= 80) return 'var(--accent-volt)';
    if (score >= 50) return 'var(--accent-orange)';
    return 'var(--accent-coral)';
  };

  const getGlowClass = (score) => {
    if (score >= 80) return 'var(--accent-volt-glow)';
    if (score >= 50) return 'var(--accent-orange-glow)';
    return 'var(--accent-coral-glow)';
  };

  const formatDateHeader = (dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const mIdx = parseInt(parts[1], 10) - 1;
      return `${parseInt(parts[2], 10)} ${months[mIdx] || 'Maret'} ${parts[0]}`;
    }
    return dateStr;
  };

  // Toggle Theme Function
  const toggleTheme = () => {
    setTheme(prev => prev === 'light-theme' ? 'dark-theme' : 'light-theme');
  };

  // Timer controls toggles
  const handleUpdateSpendCap = (newLimit) => {
    setGoals(prev => {
      const hasLimit = prev.some(g => g.type === 'spend_cap');
      if (hasLimit) {
        return prev.map(g => g.type === 'spend_cap' ? { ...g, targetValue: newLimit } : g);
      } else {
        return [...prev, { id: 'goal_spend', name: 'Limit Belanja Harian', type: 'spend_cap', targetValue: newLimit }];
      }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('lifeos_user_id');
    localStorage.removeItem('lifeos_user_email');
    setUserId('');
    setUserEmail('');
    setTasks([]);
    setFinances([]);
    setCurrentDay({
      sleepHours: 7,
      sleepQuality: 'good',
      steps: 0,
      workoutMinutes: 0,
      waterIntake: 0,
      directMood: 'neutral',
      date: ''
    });
    setAssets([]);
    setSavings([]);
    setDebts([]);
    setHistory([]);
    setChatHistory([
      {
        id: 'msg_welcome',
        sender: 'ai',
        text: 'Halo! Aku **LifeOS AI Core**, sekretaris pribadi berbasis AI-mu. 🌌\n\nAda yang mau kamu ceritakan tentang mood, aktivitas, atau rencana jajanmu hari ini? Ketik saja, biar aku log dan selaraskan jadwalmu otomatis!',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setUserProfile({
      name: 'User LifeOS',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150&h=150',
      bio: 'Mengelola hidup lebih teratur dengan LifeOS ✨'
    });
    setActiveScreen('dashboard');
    window.location.hash = '';
  };

  const toggleTimer = () => setTimerRunning(!timerRunning);
  const resetTimer = () => {
    setTimerRunning(false);
    setTimerTime(1500);
  };

  if (!userId || !userEmail) {
    return (
      <div className={`app-viewport theme-transition ${theme}`}>
        <div className="phone-screen theme-transition" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '2rem' }}>
          <AuthScreen setUserId={setUserId} setUserEmail={setUserEmail} theme={theme} toggleTheme={toggleTheme} />
        </div>
      </div>
    );
  }

  return (
    <div className={`app-viewport theme-transition ${theme}`}>
      <div className="phone-screen theme-transition">
        
        {/* Navigation Header Component */}
        <Header 
          theme={theme}
          toggleTheme={toggleTheme}
          onOpenDiagnosis={() => setShowAiDiagnosisModal(true)}
          onOpenNotifications={() => setShowNotificationModal(true)}
          streakCount={streakCount}
          isStreakActive={isStreakActive}
          userProfile={userProfile}
          onOpenProfile={() => { setActiveScreen('profile'); setAiChatOpen(false); }}
        />

        {/* Friendly greeting */}
        <section className="welcome-coach-bar" onClick={() => { setActiveScreen('profile'); setAiChatOpen(false); }} style={{ cursor: 'pointer', margin: '0.5rem 1rem 0.25rem 1rem' }}>
          <img 
            src={userProfile.avatar} 
            alt="User" 
            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-volt)' }}
          />
          <div className="welcome-text-group">
            <h2 className="welcome-title">Halo, {userProfile.name}! ✨</h2>
            <span className="welcome-subtitle" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Kelola profil & pengaturan akun Anda</span>
          </div>
        </section>

        {/* Dynamic Task Time Reminder */}
        {(() => {
          const currentHour = currentTimeState.getHours();
          
          // Filter active tasks today that have a time set
          const todayActiveTasksWithTime = tasks.filter(t => 
            t.dueDate === selectedDate && 
            t.status === 'pending' && 
            t.time
          );

          if (todayActiveTasksWithTime.length === 0) return null;

          // Find tasks that match the current hour
          const currentHourTasks = todayActiveTasksWithTime.filter(t => {
            const [h] = t.time.split(':').map(Number);
            return h === currentHour;
          });

          // Sort other tasks chronologically
          const upcomingTasks = todayActiveTasksWithTime.filter(t => {
            const [h] = t.time.split(':').map(Number);
            return h !== currentHour;
          }).sort((a, b) => a.time.localeCompare(b.time));

          return (
            <section className="dashboard-time-reminder" style={{ margin: '0 1rem 0.5rem 1rem' }}>
              {currentHourTasks.length > 0 ? (
                <div className="glass-panel" style={{
                  border: '1px solid var(--accent-volt-dark)',
                  background: 'linear-gradient(135deg, rgba(187, 238, 0, 0.1), rgba(192, 132, 252, 0.05))',
                  boxShadow: '0 8px 32px rgba(187, 238, 0, 0.15)',
                  padding: '1rem',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="live-pulse" style={{ width: '8px', height: '8px', background: 'var(--accent-volt)', borderRadius: '50%', display: 'inline-block' }}></span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-volt-dark)', letterSpacing: '0.5px' }}>
                        TUGAS JAM SEKARANG
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Pukul {currentTimeState.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {currentHourTasks.map(t => (
                    <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: '#fff' }}>{t.text}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={10} /> Terjadwal pukul {t.time} • Prio: <span style={{ color: t.priority === 'high' ? 'var(--accent-coral)' : 'var(--accent-orange)' }}>{t.priority.toUpperCase()}</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleTaskStatus(t.id)}
                          style={{
                            background: 'var(--accent-volt)',
                            color: '#000',
                            border: 'none',
                            padding: '0.35rem 0.75rem',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          Selesai
                        </button>
                      </div>
                      {t.link && (
                        <a 
                          href={t.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          style={{
                            background: 'rgba(34, 211, 238, 0.15)',
                            color: 'var(--accent-cyan)',
                            border: '1px solid rgba(34, 211, 238, 0.3)',
                            padding: '0.45rem',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px'
                          }}
                        >
                          <Video size={14} /> Gabung Rapat / Buka Tautan Kerja
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel volt-card" style={{
                  padding: '0.9rem 1.1rem',
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(34, 211, 238, 0.05))',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.08)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bell size={12} color="var(--accent-purple)" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--accent-purple)', letterSpacing: '0.5px' }}>
                        PENGINGAT TUGAS BERIKUTNYA
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Mendatang hari ini
                    </span>
                  </div>
                  {upcomingTasks.slice(0, 1).map(t => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{
                          background: 'rgba(192, 132, 252, 0.15)',
                          color: 'var(--accent-purple)',
                          padding: '0.15rem 0.35rem',
                          borderRadius: '6px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold',
                          marginRight: '6px'
                        }}>
                          {t.time}
                        </span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>
                          {t.text}
                        </span>
                      </div>
                      {t.link && (
                        <a 
                          href={t.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--accent-cyan)',
                            textDecoration: 'none',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          Rapat <Video size={10} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })()}

        {/* Selected Date Task List */}
        <section className="recent-activity-ledger" style={{ margin: '0 1rem 0.5rem 1rem' }}>
          <div className="section-label-row" style={{ marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span className="section-title-label" style={{ fontSize: '0.82rem', fontWeight: '800', letterSpacing: '0.3px', color: 'var(--text-primary)' }}>
                📅 Event Tugas: {formatDateHeader(selectedDate)}
              </span>
              {filteredTasks.length > 0 && (() => {
                const completedCount = filteredTasks.filter(t => t.status === 'completed').length;
                const totalCount = filteredTasks.length;
                const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <div style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${completionPercentage}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-volt), var(--accent-cyan))', borderRadius: '10px', transition: 'width 0.3s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.62rem', color: 'var(--accent-volt)', fontWeight: 'bold' }}>{completionPercentage}% Selesai</span>
                  </div>
                );
              })()}
            </div>
            <button className="section-subtitle-btn" onClick={() => setActiveScreen('tasks')}>Kelola Semua</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(() => {
              // Helper to check if task time is in the past
              const isPastTime = (taskTime, taskDate) => {
                if (!taskTime) return false;
                const todayStr = new Date().toISOString().split('T')[0];
                if (taskDate !== todayStr) {
                  return taskDate < todayStr;
                }
                const [taskHour, taskMin] = taskTime.split(':').map(Number);
                const now = currentTimeState || new Date();
                const currentHour = now.getHours();
                const currentMin = now.getMinutes();
                
                if (taskHour < currentHour) return true;
                if (taskHour === currentHour && taskMin < currentMin) return true;
                return false;
              };

              // Sort tasks: Active & Future first, then Past Pending, then Completed.
              const sortedTasks = [...filteredTasks].sort((a, b) => {
                const aComp = a.status === 'completed';
                const bComp = b.status === 'completed';
                if (aComp !== bComp) return aComp ? 1 : -1;

                const aPast = isPastTime(a.time, a.dueDate);
                const bPast = isPastTime(b.time, b.dueDate);
                
                // If both are same completion status:
                // Pending & Not Past first, Pending & Past second
                if (!aComp) {
                  if (aPast !== bPast) return aPast ? 1 : -1;
                }
                
                // Sort by time
                if (a.time && b.time) return a.time.localeCompare(b.time);
                if (a.time) return -1;
                if (b.time) return 1;
                return 0;
              });

              return sortedTasks.map(t => {
                const isCompleted = t.status === 'completed';
                const isPast = isPastTime(t.time, t.dueDate) && !isCompleted;
                
                let categoryColor = 'var(--accent-orange)';
                let categoryBg = 'rgba(249, 115, 22, 0.08)';
                let categoryBorder = 'rgba(249, 115, 22, 0.2)';

                if (t.tag === 'Productivity') {
                  categoryColor = 'rgba(168, 85, 247, 1)';
                  categoryBg = 'rgba(168, 85, 247, 0.08)';
                  categoryBorder = 'rgba(168, 85, 247, 0.25)';
                } else if (t.tag === 'Health') {
                  categoryColor = 'rgba(34, 197, 94, 1)';
                  categoryBg = 'rgba(34, 197, 94, 0.08)';
                  categoryBorder = 'rgba(34, 197, 94, 0.25)';
                } else if (t.tag === 'Finance') {
                  categoryColor = 'var(--accent-cyan)';
                  categoryBg = 'rgba(34, 211, 238, 0.08)';
                  categoryBorder = 'rgba(34, 211, 238, 0.25)';
                }

                // Add premium styling to look "not templatey"
                return (
                  <div 
                    key={t.id} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: isCompleted 
                        ? 'var(--bg-pill)' 
                        : isPast 
                          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), var(--card-bg))'
                          : 'var(--card-bg)',
                      border: isPast 
                        ? '1px solid rgba(239, 68, 68, 0.25)' 
                        : isCompleted
                          ? '1px solid var(--card-border-inner)'
                          : '1px solid var(--card-border)',
                      borderLeft: `4px solid ${isPast ? 'var(--accent-coral)' : categoryColor}`,
                      borderRadius: '16px',
                      transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isCompleted 
                        ? 'none' 
                        : isPast 
                          ? '0 4px 16px rgba(239, 68, 68, 0.05)'
                          : 'var(--card-shadow), inset 0 1px 0 rgba(255,255,255,0.05)',
                      opacity: isCompleted ? 0.5 : 1,
                      transform: isCompleted ? 'scale(0.97)' : 'scale(1)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Glow design decoration */}
                    {!isCompleted && !isPast && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        background: `radial-gradient(circle at 0% 50%, ${categoryColor}15, transparent 40%)`,
                        pointerEvents: 'none'
                      }} />
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0, zIndex: 1 }}>
                      <div 
                        onClick={() => toggleTaskStatus(t.id)}
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          border: `2px solid ${isCompleted ? categoryColor : isPast ? 'var(--accent-coral)' : 'var(--text-muted)'}`,
                          background: isCompleted ? categoryColor : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          flexShrink: 0,
                          boxShadow: !isCompleted && !isPast ? `0 0 8px ${categoryColor}20` : 'none'
                        }}
                      >
                        {isCompleted && <Check size={12} color="#000" strokeWidth={3} />}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                        <span 
                          style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 650, 
                            color: isCompleted ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            letterSpacing: '0.1px'
                          }}
                        >
                          {t.text}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            background: categoryBg,
                            color: categoryColor,
                            border: `1px solid ${categoryBorder}`,
                            padding: '0.1rem 0.35rem',
                            borderRadius: '6px',
                            fontSize: '0.62rem',
                            fontWeight: 'bold',
                            letterSpacing: '0.2px'
                          }}>
                            {t.tag}
                          </span>
                          {t.time && (
                            <span style={{ 
                              fontSize: '0.62rem', 
                              color: isPast ? 'var(--accent-coral)' : 'var(--text-muted)', 
                              fontWeight: isPast ? 'bold' : 'normal',
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '2px' 
                            }}>
                              <Clock size={9} /> {isPast ? `Terlewat (${t.time})` : t.time}
                            </span>
                          )}
                          <span style={{
                            fontSize: '0.62rem',
                            color: t.priority === 'high' ? 'var(--accent-coral)' : 'var(--accent-orange)',
                            fontWeight: 'bold'
                          }}>
                            {t.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isCompleted && (
                      <button 
                        onClick={() => handleSnoozeTask(t.id)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.04)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '26px',
                          height: '26px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: isPast ? 'var(--accent-coral)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          zIndex: 1
                        }}
                      >
                        <Clock size={11} />
                      </button>
                    )}
                  </div>
                );
              });
            })()}
            {filteredTasks.length === 0 && (
              <div style={{ 
                textAlign: 'center', 
                padding: '1rem', 
                background: 'linear-gradient(135deg, rgba(25, 25, 35, 0.4), rgba(15, 15, 20, 0.6))',
                border: '1px dashed var(--card-border)',
                borderRadius: '14px',
                color: 'var(--text-muted)', 
                fontSize: '0.75rem' 
              }}>
                ☕ Belum ada event tugas terdaftar hari ini.
              </div>
            )}
          </div>
        </section>

        {/* Calendar Widget */}
        <CalendarWidget 
          history={history}
          selectedDate={selectedDate}
          tasks={tasks}
          finances={finances}
          handleSelectCalendarDay={handleSelectCalendarDay}
        />

        {/* Dashboard index (LQS Widget is now the Homepage Hero at the very top) */}
        <Dashboard 
          finalScore={finalScore}
          breakdown={breakdown}
          aiExplanation={aiExplanation}
          getGlowColor={getGlowColor}
          getGlowClass={getGlowClass}
          isQuotaExceeded={isQuotaExceeded}
        />

        {/* Prominent AI Summary Card */}
        <section className="ai-summary-card glass-panel volt-card" style={{ margin: '0 1rem 0.5rem 1rem', padding: '1.25rem', borderLeft: '4px solid var(--accent-cyan)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={16} color="var(--accent-cyan)" />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Kesimpulan AI Hari Ini</span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {dailySummary?.summary || 'Menganalisis aktivitas dan perkembangan hari ini... ⚡'}
          </p>
        </section>

        {/* Demand Sliders summary */}
        <section className="upcoming-habits-scroll-box">
          <div className="section-label-row">
            <span className="section-title-label" style={{ color: '#fff' }}>Tagihan & Tuntutan Hari Ini</span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold' }}>SWIPE HORIZONTAL</span>
          </div>
          <div className="upcoming-horizontal-flex">
            <div className="upcoming-subcard">
              <div className="subcard-title-row"><Moon size={10} color="var(--accent-volt)" /><span>Tidur Semalam</span></div>
              <span className="subcard-primary-label">{currentDay ? currentDay.sleepHours : 7.5} Jam</span>
              <span className="subcard-secondary-label">Kualitas: {currentDay ? currentDay.sleepQuality : 'good'}</span>
            </div>
            {isTrackingGps ? (
              <div className="upcoming-subcard" style={{ borderColor: '#fc4c02', background: 'linear-gradient(135deg, rgba(252, 76, 2, 0.15), rgba(0, 0, 0, 0.3))', minWidth: '170px' }}>
                <div className="subcard-title-row">
                  <span className="animate-pulse" style={{ color: '#fc4c02', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    🔴 LIVE TRACKING
                  </span>
                </div>
                <span className="subcard-primary-label" style={{ fontSize: '1.1rem', color: '#fff' }}>
                  {gpsDistance.toFixed(2)} km
                </span>
                <span style={{ fontSize: '0.65rem', color: '#fc4c02', fontWeight: 'bold' }}>
                  ⏱️ {Math.floor(gpsSeconds / 60)}m {gpsSeconds % 60}s
                </span>
                <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)' }}>
                  Est: ~{Math.round(gpsDistance / 0.00075)} steps
                </span>
                <button 
                  type="button" 
                  onClick={stopGpsTracking} 
                  style={{ background: '#fc4c02', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.6rem', padding: '4px 8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}
                >
                  ⏹️ Hentikan & Simpan
                </button>
              </div>
            ) : (
              <div className="upcoming-subcard" style={{ borderColor: 'rgba(252, 76, 2, 0.4)', background: 'linear-gradient(135deg, rgba(252, 76, 2, 0.08), rgba(0, 0, 0, 0.2))', minWidth: '170px' }}>
                <div className="subcard-title-row">
                  <Activity size={10} color="#fc4c02" />
                  <span style={{ color: '#fc4c02', fontWeight: 'bold' }}>STRAVA TRACKER</span>
                </div>
                <span className="subcard-primary-label" style={{ fontSize: '0.85rem' }}>
                  {(currentDay ? currentDay.steps * 0.00075 : 0).toFixed(2)} km
                </span>
                <span className="subcard-secondary-label" style={{ fontSize: '0.65rem', color: '#fc4c02', fontWeight: 'bold' }}>
                  🔥 {currentDay ? currentDay.steps : 0} Steps ({currentDay ? Math.round(currentDay.steps * 0.04) : 0} kcal)
                </span>
                <span className="subcard-action-value" style={{ fontSize: '0.7rem', color: 'var(--text-primary)' }}>
                  ⏱️ {currentDay ? currentDay.workoutMinutes : 0} Min Workout
                </span>
                <button 
                  type="button" 
                  onClick={startGpsTracking} 
                  style={{ background: 'rgba(252, 76, 2, 0.2)', color: '#fc4c02', border: '1px solid #fc4c02', borderRadius: '8px', fontSize: '0.6rem', padding: '4px 8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}
                >
                  🏃 Mulai Lari/Jalan
                </button>
              </div>
            )}

            {/* Savings Targets Card */}
            {savings.length > 0 ? (
              savings.map(s => {
                const remaining = s.targetAmount - s.currentAmount;
                return (
                  <div className="upcoming-subcard" key={s.id} style={{ borderColor: 'var(--accent-purple-glow)', minWidth: '160px' }}>
                    <div className="subcard-title-row">
                      <Target size={10} color="var(--accent-purple)" />
                      <span>TARGET TABUNGAN</span>
                    </div>
                    <span className="subcard-primary-label" style={{ fontSize: '0.8rem' }}>{s.name}</span>
                    <span className="subcard-secondary-label" style={{ fontSize: '0.6rem' }}>
                      Target: Rp {s.targetAmount.toLocaleString('id-ID')}
                    </span>
                    <span className="subcard-action-value" style={{ fontSize: '0.75rem', color: remaining > 0 ? 'var(--accent-coral)' : 'var(--accent-volt)' }}>
                      {remaining > 0 ? `Kurang: Rp ${remaining.toLocaleString('id-ID')}` : '🎉 Tercapai!'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div 
                className="upcoming-subcard" 
                onClick={() => setActiveScreen('finance')} 
                style={{ cursor: 'pointer', border: '1px dashed var(--text-muted)', minWidth: '160px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
              >
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>TARGET TABUNGAN</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '4px' }}>+ Tambah Tabungan</div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Floating Capsule Navbar */}
      <nav className="floating-capsule-navbar theme-transition">
        <button className={`capsule-nav-btn ${activeScreen === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveScreen('dashboard'); setAiChatOpen(false); }}>
          <Compass size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px', color: 'inherit', fontWeight: 'bold' }}>Beranda</span>
        </button>
        <button className={`capsule-nav-btn ${activeScreen === 'tasks' ? 'active' : ''}`} onClick={() => { setActiveScreen('tasks'); setAiChatOpen(false); }}>
          <CheckSquare size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px', color: 'inherit', fontWeight: 'bold' }}>Tugas</span>
        </button>
        <button 
          className={`phone-notch-pill-btn ${activeScreen === 'garden' ? 'active' : ''}`} 
          onClick={() => { setActiveScreen('garden'); setAiChatOpen(false); }}
          style={{
            background: isStreakActive ? 'linear-gradient(135deg, var(--accent-orange), #ff477e)' : 'linear-gradient(135deg, var(--accent-volt), #d4ff00)',
            boxShadow: isStreakActive ? '0 0 15px rgba(251, 146, 60, 0.4)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#000',
            position: 'relative'
          }}
          title="Pohon Kehidupan & Streak Api"
        >
          {isStreakActive ? <Flame size={20} fill="#000" /> : <Leaf size={20} fill="#000" />}
          {streakCount > 0 && (
            <span style={{ fontSize: '8px', fontWeight: '900', position: 'absolute', bottom: '2px', color: '#000' }}>
              {streakCount}H
            </span>
          )}
        </button>
        <button className={`capsule-nav-btn ${activeScreen === 'finance' ? 'active' : ''}`} onClick={() => { setActiveScreen('finance'); setAiChatOpen(false); }}>
          <DollarSign size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px', color: 'inherit', fontWeight: 'bold' }}>Dompet</span>
        </button>
        <button className={`capsule-nav-btn ${activeScreen === 'habits' ? 'active' : ''}`} onClick={() => { setActiveScreen('habits'); setAiChatOpen(false); }}>
          <Activity size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px', color: 'inherit', fontWeight: 'bold' }}>Laporan</span>
        </button>
      </nav>

      {/* Persistent Floating Action Button (FAB) for AI Advisor */}
      <button 
        className="ai-advisor-fab"
        onClick={() => setAiChatOpen(true)}
        title="Tanya AI Advisor"
      >
        <Sparkles size={20} className="spinning-ai-star" />
        {chatHistory.length > 0 && chatHistory[chatHistory.length - 1].sender === 'ai' && !aiChatOpen && (
          <div className="ai-fab-badge" />
        )}
      </button>

      {/* Overlays Panels */}
      {activeScreen === 'garden' && (
        <GrowthGarden 
          tasks={tasks}
          savings={savings}
          currentDay={currentDay}
          streakCount={streakCount}
          isStreakActive={isStreakActive}
        />
      )}

      {activeScreen === 'tasks' && (
        <TasksManager 
          tasks={tasks}
          filteredTasks={filteredTasks}
          selectedDate={selectedDate}
          taskText={taskText}
          setTaskText={setTaskText}
          taskPriority={taskPriority}
          setTaskPriority={setTaskPriority}
          taskTag={taskTag}
          setTaskTag={setTaskTag}
          taskTime={taskTime}
          setTaskTime={setTaskTime}
          taskEndTime={taskEndTime}
          setTaskEndTime={setTaskEndTime}
          taskDate={taskDate}
          setTaskDate={setTaskDate}
          taskLink={taskLink}
          setTaskLink={setTaskLink}
          handleAddTask={handleAddTask}
          toggleTaskStatus={toggleTaskStatus}
          handleSnoozeTask={handleSnoozeTask}
          onDeleteTask={handleDeleteTask}
          onUpdateTask={handleUpdateTask}
          timerTime={timerTime}
          timerRunning={timerRunning}
          toggleTimer={toggleTimer}
          resetTimer={resetTimer}
          ambientSound={ambientSound}
          setAmbientSound={setAmbientSound}
          formatDateHeader={formatDateHeader}
          onSelectFocusTask={(t) => {
            setFocusTask(t);
            setTimerTime(1500); // 25 min focus limit
            setTimerRunning(true);
          }}
          focusTask={focusTask}
          dailySummary={dailySummary}
        />
      )}

      {activeScreen === 'finance' && (
        <FinanceManager 
          filteredFinances={filteredFinances}
          selectedDate={selectedDate}
          txnDesc={txnDesc}
          setTxnDesc={setTxnDesc}
          txnAmount={txnAmount}
          setTxnAmount={setTxnAmount}
          txnType={txnType}
          setTxnType={setTxnType}
          txnCategory={txnCategory}
          setTxnCategory={setTxnCategory}
          txnAssetId={txnAssetId}
          setTxnAssetId={setTxnAssetId}
          handleAddTransaction={handleAddTransaction}
          onAddDirectTransaction={handleAddDirectTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          history={history}
          formatDateHeader={formatDateHeader}
          assets={assets}
          goals={goals}
          savings={savings}
          setSavings={setSavings}
          debts={debts}
          setDebts={setDebts}
          onAddAsset={handleAddAsset}
          onUpdateAssetBalance={handleUpdateAssetBalance}
          onDeleteAsset={handleDeleteAsset}
          onUpdateSpendCap={handleUpdateSpendCap}
          finances={finances}
        />
      )}

      {activeScreen === 'assets' && (
        <AssetsManager 
          assets={assets}
          onAddAsset={handleAddAsset}
          onUpdateAssetBalance={handleUpdateAssetBalance}
          onDeleteAsset={handleDeleteAsset}
          finances={finances}
          savings={savings}
        />
      )}

      {activeScreen === 'goals' && (
        <GoalsManager 
          goals={goals}
          onAddGoal={handleAddGoal}
          onDeleteGoal={handleDeleteGoal}
          currentDay={currentDay}
          filteredTasks={filteredTasks}
          filteredFinances={filteredFinances}
          assets={assets}
        />
      )}

      {activeScreen === 'habits' && (
        <HabitsManager 
          currentDay={currentDay}
          setCurrentDay={setCurrentDay}
          selectedDate={selectedDate}
          formatDateHeader={formatDateHeader}
          startGpsTracking={startGpsTracking}
          stopGpsTracking={stopGpsTracking}
          gpsSeconds={gpsSeconds}
          gpsDistance={gpsDistance}
          isTrackingGps={isTrackingGps}
        />
      )}

      {activeScreen === 'insights' && (
        <InsightsManager insightsList={insightsList} />
      )}

      {activeScreen === 'profile' && (
        <ProfileManager 
          userProfile={userProfile}
          onUpdateProfile={handleUpdateProfile}
          tasks={tasks}
          streakCount={streakCount}
          isStreakActive={isStreakActive}
          selectedDate={selectedDate}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onResetAllData={handleResetAllData}
          onLogout={handleLogout}
          userId={userId}
        />
      )}

      {/* AI Assessment modal */}
      {showAiDiagnosisModal && (
        <div className="subpanel-overlay">
          <div className="subpanel-header">
            <span className="subpanel-title">🧠 AI Core Assessment</span>
            <button className="circular-utility-btn" onClick={() => setShowAiDiagnosisModal(false)}><X size={16} /></button>
          </div>
          <div className="ai-diagnosis-card">
            <h3>LQS Diagnostics: {finalScore}/100</h3>
            <br />
            <div dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(aiExplanation.explanation) }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>AI Recommendations:</span>
            {(aiExplanation.advice || []).map((adv, idx) => (
              <div key={idx} style={{ background: 'var(--bg-pill)', borderLeft: '4px solid var(--accent-volt-dark)', padding: '0.6rem 0.85rem', borderRadius: '12px', fontSize: '0.75rem' }}>
                {adv}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notification Modal alert */}
      {showNotificationModal && (
        <div className="subpanel-overlay">
          <div className="subpanel-header">
            <span className="subpanel-title">🔔 Smart Notifications</span>
            <button className="circular-utility-btn" onClick={() => setShowNotificationModal(false)}><X size={16} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredTasks.filter(t => t.status === 'snoozed').length >= 3 && (
              <div className="recent-row-item" style={{ borderLeft: '4px solid var(--accent-coral)' }}>
                <div className="row-item-text-stack">
                  <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--accent-coral)' }}>Burnout Warning</span>
                  <span style={{ fontSize: '0.7rem' }}>Anda telah menunda tugas 3x. Pecah tugas segera!</span>
                </div>
              </div>
            )}
            {filteredFinances.reduce((sum, f) => sum + f.amount, 0) > 150000 && (
              <div className="recent-row-item" style={{ borderLeft: '4px solid var(--accent-coral)' }}>
                <div className="row-item-text-stack">
                  <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--accent-coral)' }}>Budget Overrun</span>
                  <span style={{ fontSize: '0.7rem' }}>Pengeluaran melampaui limit Rp150K.</span>
                </div>
              </div>
            )}
            <div className="recent-row-item" style={{ borderLeft: '4px solid var(--accent-volt-dark)' }}>
              <div className="row-item-text-stack">
                <span style={{ fontWeight: 'bold', fontSize: '0.8rem', color: 'var(--accent-volt-dark)' }}>AI Learning Sync</span>
                <span style={{ fontSize: '0.7rem' }}>Model personal terupdate.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Slide up AI Chat Advisor */}
      <AiChatCompanion 
        aiChatOpen={aiChatOpen}
        setAiChatOpen={setAiChatOpen}
        chatHistory={chatHistory}
        chatInput={chatInput}
        setChatInput={setChatInput}
        handleSendChatMessage={handleSendChatMessage}
        handleAcceptAIAction={handleAcceptAIAction}
        chatBottomRef={chatBottomRef}
        isQuotaExceeded={isQuotaExceeded}
      />

    </div>
  );
}
