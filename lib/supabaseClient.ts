import { createClient } from '@supabase/supabase-js';

// Cấu hình kết nối đến project Supabase của bạn
const supabaseUrl = 'https://hpuymoqzgwgthfryvges.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhwdXltb3F6Z3dndGhmcnl2Z2VzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NDczMzMsImV4cCI6MjA3NDQyMzMzM30.WSrT-3LeMIYqk42X4AEQGPshAGYsu_0HC5Pvi8bhRdU';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key are required.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
