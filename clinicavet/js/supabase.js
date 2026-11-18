import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const config = window.VETCARE_CONFIG || {};
export const configured = Boolean(config.url && config.anonKey);
export const supabase = configured ? createClient(config.url, config.anonKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }) : null;
