import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Replace these two values with your project credentials.
// Project URL : Supabase dashboard → Settings → API → Project URL
// Anon key    : Supabase dashboard → Settings → API → anon / public
const SUPABASE_URL = 'https://ojygxkkviunakbdbsmlj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yLIsRt07G727enYkkDcXag_hrD0rjqr';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
