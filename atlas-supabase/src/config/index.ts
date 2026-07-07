export const config = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseKey: process.env.SUPABASE_KEY || "",
};

if (!config.supabaseUrl || !config.supabaseKey) {
  console.warn("[Supabase] SUPABASE_URL or SUPABASE_KEY not set — Supabase client will fail");
}
