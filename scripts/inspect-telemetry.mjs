import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://yeuivdauozcqwyraaztx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UKM5RbPgMjVitDc5D3wk0Q_pqyxsYla';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function inspectTelemetry() {
  console.log("==================================================");
  console.log("🔍 Business Creator - Live Platform Error Telemetry");
  console.log("==================================================");
  console.log(`Connecting to Supabase at: ${SUPABASE_URL}`);

  try {
    const { data: errorLogs, error } = await supabase
      .from('logs')
      .select('*')
      .ilike('action', '%ERROR%')
      .order('timestamp', { ascending: false })
      .limit(15);

    if (error) {
      console.error("Failed to query logs table:", error.message);
      return;
    }

    if (!errorLogs || errorLogs.length === 0) {
      console.log("✅ No runtime error logs found in the database. Platform is healthy!");
      return;
    }

    console.log(`\nFound ${errorLogs.length} recent error events:\n`);

    errorLogs.forEach((log, index) => {
      console.log(`[#${index + 1}] ⏰ ${log.timestamp} | User: ${log.user_email || log.user_id || 'Anonymous'}`);
      console.log(`📌 Action: ${log.action}`);
      if (log.details) {
        console.log(`📝 Details:`, JSON.stringify(log.details, null, 2));
      }
      console.log("--------------------------------------------------");
    });

  } catch (err) {
    console.error("Telemetry inspector exception:", err);
  }
}

inspectTelemetry();
