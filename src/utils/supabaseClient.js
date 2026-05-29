import { createClient } from '@supabase/supabase-js';

// Load Supabase url & anon key from Vite env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseAnonKey;
};

// Initialize Supabase Client if configured
export const supabase = isSupabaseConfigured() 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Fetch all user data from Supabase
 * Falls back to local storage data if database sync fails or isn't set up.
 */
export async function pullUserData(userId) {
  if (!supabase || !userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('lifeos_user_data')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') {
        // Row not found, we will create a default row during the first push
        return null;
      }
      console.warn("Error pulling user data from Supabase:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.error("Failed to connect to Supabase database:", err);
    return null;
  }
}

/**
 * Push all user data to Supabase
 */
export async function pushUserData(state, userId) {
  if (!supabase || !userId) return false;

  const payload = {
    id: userId,
    updated_at: new Date().toISOString(),
    tasks: state.tasks || [],
    finances: state.finances || [],
    current_day: state.currentDay || {},
    assets: state.assets || [],
    savings: state.savings || [],
    debts: state.debts || [],
    history: state.history || [],
    chat_history: state.chatHistory || [],
    user_profile: state.userProfile || {}
  };

  try {
    const { error } = await supabase
      .from('lifeos_user_data')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn("Error upserting user data to Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to push user data to Supabase:", err);
    return false;
  }
}
