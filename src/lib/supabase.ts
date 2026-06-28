import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gzlysunpquvvdsweoams.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bHlzdW5wcXV2dmRzd2VvYW1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MzE2MjAsImV4cCI6MjA5ODIwNzYyMH0.b_FijKa6jREtBU0qw2QedWuvrUtEjcNMxMVYXBwJMeU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
