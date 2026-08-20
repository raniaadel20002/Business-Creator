import { createClient } from '@supabase/supabase-js';
import { loadEnv } from './load-env.mjs';

const envVars = loadEnv();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL || envVars.SUPABASE_URL || 'https://yeuivdauozcqwyraaztx.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY || 'sb_publishable_UKM5RbPgMjVitDc5D3wk0Q_pqyxsYla';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function runFullDiagnosis() {
  console.log('======================================================================');
  console.log('🔍 BUSINESS CREATOR - COMPREHENSIVE LIVE HEALTH & ERROR DIAGNOSTIC');
  console.log('======================================================================\n');

  // 1. Check Database Connectivity & Logs
  console.log('📡 [1/5] Checking Supabase Database Connectivity & Recent Logs...');
  try {
    const { data: allLogs, error: logError } = await supabase
      .from('logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(30);

    if (logError) {
      console.error('❌ Error querying logs table:', logError.message);
    } else {
      console.log(`✅ Logs table accessible. Total fetched recent entries: ${allLogs.length}`);
      
      const errorLogs = allLogs.filter(l => 
        (l.action && (l.action.toLowerCase().includes('error') || l.action.toLowerCase().includes('fail') || l.action.toLowerCase().includes('exception'))) || 
        (l.details && JSON.stringify(l.details).toLowerCase().includes('error'))
      );

      if (errorLogs.length > 0) {
        console.log(`⚠️ Found ${errorLogs.length} recent error/warning logs:`);
        errorLogs.forEach((err, idx) => {
          console.log(`   [#${idx + 1}] ⏰ ${err.timestamp} | User: ${err.user_email || err.user_id || 'Anon'}`);
          console.log(`       Action: ${err.action}`);
          if (err.details) console.log(`       Details:`, JSON.stringify(err.details));
        });
      } else {
        console.log('✅ No error events detected in database logs. Platform runtime is clean!');
      }
    }
  } catch (err) {
    console.error('❌ Exception checking logs:', err);
  }

  // 2. Check Projects Table Health
  console.log('\n📊 [2/5] Checking Projects Table Structure & Recent Records...');
  try {
    const { data: projects, error: projError } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (projError) {
      console.error('❌ Error querying projects table:', projError.message);
    } else {
      console.log(`✅ Projects table accessible. Recent projects found: ${projects.length}`);
      projects.forEach((p, idx) => {
        const title = p.title || p.name || p.projectName || (p.data && p.data.projectName) || 'Unnamed';
        const hasPlan = (p.plan || p.data) ? '✅ Plan/Data Present' : '⚠️ Empty';
        console.log(`   [#${idx + 1}] ID: ${p.id} | Title: "${title}" | Created: ${p.created_at} | ${hasPlan}`);
      });
    }
  } catch (err) {
    console.error('❌ Exception checking projects:', err);
  }

  // 3. Check Users / Profiles Table
  console.log('\n👥 [3/5] Checking Users / Profiles Table...');
  try {
    const { data: profiles, error: profError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, plan_tier, tokens_balance, created_at')
      .limit(5);

    if (profError) {
      console.warn('⚠️ Profiles query note:', profError.message);
    } else {
      console.log(`✅ Profiles table accessible. Sample count: ${profiles.length}`);
      profiles.forEach((u, idx) => {
        console.log(`   - User: ${u.email || u.id} | Plan: ${u.plan_tier || 'free'} | Tokens: ${u.tokens_balance ?? 'N/A'}`);
      });
    }
  } catch (e) {}

  // 4. Test Available Gemini Models (Quota & Rate Limit Health Check)
  console.log('\n🤖 [4/5] Testing AI Models Availability & Quotas...');
  let geminiKey = process.env.VITE_GEMINI_API_KEY || envVars.VITE_GEMINI_API_KEY || envVars.GEMINI_API_KEY;
  if (!geminiKey || !geminiKey.startsWith("AIzaSy")) {
    geminiKey = "AIzaSyBMEPQ7zM9akR0ht5AQryrCPQ65asqpZog";
  }

  if (geminiKey) {
    const modelsToTest = [
      'gemini-3.5-flash',
      'gemini-3.7-flash',
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-2.5-flash'
    ];

    for (const model of modelsToTest) {
      try {
        const start = Date.now();
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Ping' }] }]
          })
        });

        const elapsed = Date.now() - start;
        const resJson = await response.json();

        if (response.ok && resJson.candidates) {
          console.log(`   ✅ Model [${model}]: WORKING (${elapsed}ms)`);
        } else if (response.status === 429) {
          console.log(`   ⚠️ Model [${model}]: 429 QUOTA EXCEEDED / RATE LIMITED (Wait or switch model)`);
        } else if (response.status === 404) {
          console.log(`   ℹ️ Model [${model}]: 404 Not Found / Deprecated`);
        } else {
          console.log(`   ❌ Model [${model}]: Status ${response.status} - ${resJson.error?.message || 'Error'}`);
        }
      } catch (err) {
        console.log(`   ❌ Model [${model}]: Network error - ${err.message}`);
      }
    }
  } else {
    console.log('   ❌ No Gemini API Key found in environment!');
  }

  // 5. OpenRouter / Groq status
  console.log('\n🌐 [5/5] Backup Providers Config...');
  const openRouterKey = process.env.VITE_OPENROUTER_API_KEY || envVars.VITE_OPENROUTER_API_KEY || envVars.OPENROUTER_API_KEY;
  const groqKey = process.env.VITE_GROQ_API_KEY || envVars.VITE_GROQ_API_KEY || envVars.GROQ_API_KEY;

  console.log(`   - OpenRouter API: ${openRouterKey ? '✅ Configured' : '⚠️ Not configured'}`);
  console.log(`   - Groq API: ${groqKey ? '✅ Configured' : '⚠️ Not configured'}`);

  console.log('\n======================================================================');
  console.log('🏁 DIAGNOSTIC FINISHED');
  console.log('======================================================================');
}

runFullDiagnosis();
