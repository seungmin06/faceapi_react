import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwajpbeufaxsmhgrtind.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YWpwYmV1ZmF4c21oZ3J0aW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTM4NDU5NjYsImV4cCI6MjAyOTQyMTk2Nn0.5_RY-cSIM-1clLkMcGXADJWp6LZF9NzyzmtYkepYBg0';

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
