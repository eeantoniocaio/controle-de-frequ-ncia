
import { createClient } from '@supabase/supabase-js';

// These will be filled with the values you provide
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gdicuxrxdtvegfvgjroz.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaWN1eHJ4ZHR2ZWdmdmdqcm96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTY4NzYsImV4cCI6MjA4MTk5Mjg3Nn0.KefFRDSD-0PGJEg_2ozzpfbzJXrfbIzKk0IY0UZwcpc';

export const supabase = createClient(supabaseUrl, supabaseKey);
