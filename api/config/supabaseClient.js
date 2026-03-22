const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase = null;

if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
  console.error('Invalid SUPABASE_URL. Set SUPABASE_URL in Vercel environment variables.');
} else if (!supabaseAnonKey) {
  console.error('Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY (recommended) or SUPABASE_ANON_KEY in Vercel environment variables.');
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

module.exports = supabase;

