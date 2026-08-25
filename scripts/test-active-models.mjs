import { loadEnv } from './load-env.mjs';

const envVars = loadEnv();
const rawKeys = process.env.VITE_GEMINI_API_KEY || envVars.VITE_GEMINI_API_KEY || envVars.GEMINI_API_KEY || "AIzaSyBMEPQ7zM9akR0ht5AQryrCPQ65asqpZog";
const keys = rawKeys.split(/[,;\n\r]+/).map(k => k.trim().replace(/^["']|["']$/g, '')).filter(k => k.length >= 25);

console.log(`Loaded ${keys.length} keys in test script.`);

async function testModelsAcrossKeys() {
  const models = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3.5-flash'];
  
  // Test with Key #1 and Key #3
  const testIndices = [0, Math.min(2, keys.length - 1)];
  
  for (const idx of testIndices) {
    const key = keys[idx];
    const masked = `${key.substring(0, 8)}...${key.substring(key.length - 4)}`;
    console.log(`\n🔑 Testing Key #${idx + 1} [${masked}] (Starts with: ${key.substring(0, 5)}):`);

    for (const m of models) {
      try {
        const start = Date.now();
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'قل كلمة واحدة فقط: تمام' }] }]
          })
        });
        const data = await res.json();
        if (res.ok) {
          console.log(`   ✅ [${m}] Status 200 OK (${Date.now() - start}ms) - Response: ${data.candidates?.[0]?.content?.parts?.[0]?.text?.trim()}`);
        } else {
          console.log(`   ⚠️ [${m}] Status ${res.status} - Code: ${data.error?.status} - Msg: ${data.error?.message?.slice(0, 120)}`);
        }
      } catch (err) {
        console.log(`   ❌ [${m}] Fetch error: ${err.message}`);
      }
    }
  }
}

testModelsAcrossKeys();
