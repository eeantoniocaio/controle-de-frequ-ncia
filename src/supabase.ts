import { createClient } from '@supabase/supabase-js';

// These must be provided via environment variables (.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables! Check your .env file.');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

