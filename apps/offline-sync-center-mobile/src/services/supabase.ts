import { createClient } from '@supabase/supabase-js';

// Same config as the main website (runtime-config.js)
const supabaseUrl = 'https://wmhqqpcppsirmzstzvem.supabase.co';
const supabaseKey = 'sb_publishable_VbokG_IEVn_ydRo9Wwvx9Q_OzLKJpoi';

export const supabase = createClient(supabaseUrl, supabaseKey);
