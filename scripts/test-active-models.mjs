import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envVars = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      envVars[key] = val;
    }
  }
}

const geminiKey = process.env.VITE_GEMINI_API_KEY || envVars.VITE_GEMINI_API_KEY || envVars.GEMINI_API_KEY || "AIzaSyBMEPQ7zM9akR0ht5AQryrCPQ65asqpZog";

async function testCurrentModels() {
  const models = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-flash-latest',
    'gemini-3.5-flash',
    'gemini-3.7-flash'
  ];

  console.log('Testing models with Gemini Key...');
  for (const m of models) {
    try {
      const start = Date.now();
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${geminiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Respond with OK.' }] }]
        })
      });
      const data = await res.json();
      if (res.ok) {
        console.log(`✅ [${m}] Status 200 OK (${Date.now() - start}ms) - Response: ${data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()}`);
      } else {
        console.log(`⚠️ [${m}] Status ${res.status} - Code: ${data.error?.status} - Msg: ${data.error?.message?.slice(0, 100)}`);
      }
    } catch (e) {
      console.log(`❌ [${m}] Fetch error: ${e.message}`);
    }
  }
}

testCurrentModels();
