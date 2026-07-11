const axios = require('axios');
require('dotenv').config();

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjZhMzNjMDk3ODA1Y2M4NTQ1OTdhMjAzYSIsImlhdCI6MTc4MTgwNjM5MywiZXhwIjoxNzg0Mzk4MzkzfQ.9g52J6qgsjUzydti_19Arl1LOJtdVyi5DAkaO8aHgoI';
const API_URL = 'http://localhost:5000/api/buses';
const RUNS = 10; // run 10 times each for accuracy

async function measureRequest(label) {
  const start = Date.now();
  await axios.get(API_URL, { 
    headers: { Authorization: `Bearer ${TOKEN}` } 
  });
  const time = Date.now() - start;
  console.log(`  ${label}: ${time}ms`);
  return time;
}

async function average(times) {
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
}

async function runTest() {
  console.log('🧪 Running cache performance test...\n');

  // Warm up: fire one request to make sure cache is populated
  console.log('Warming up cache...');
  await measureRequest('warmup (ignore)');
  console.log('');

  // Measure CACHE HIT times (cache is already populated from warmup)
  console.log(`📊 Cache HIT times (${RUNS} runs):`);
  const hitTimes = [];
  for (let i = 0; i < RUNS; i++) {
    hitTimes.push(await measureRequest(`  Run ${i + 1}`));
  }
  const avgHit = await average(hitTimes);

  // Wait for cache to expire (31 seconds) then measure CACHE MISS times
  console.log(`\n⏳ Waiting 31 seconds for cache to expire...`);
  await new Promise(resolve => setTimeout(resolve, 31000));

  console.log(`\n📊 Cache MISS times (${RUNS} runs):`);
  const missTimes = [];
  for (let i = 0; i < RUNS; i++) {
    // After first miss, cache repopulates - so clear it each time
    // by waiting for expiry OR just measure first miss only
    missTimes.push(await measureRequest(`  Run ${i + 1}`));
    if (i < RUNS - 1) {
      await new Promise(resolve => setTimeout(resolve, 31000));
      console.log('  (waiting for cache to expire again...)');
    }
  }
  const avgMiss = await average(missTimes);

  // Final results
  const improvement = ((avgMiss - avgHit) / avgMiss * 100).toFixed(1);
  
  console.log('\n=============================');
  console.log('📊 FINAL RESULTS');
  console.log('=============================');
  console.log(`Average cache MISS (MongoDB): ${avgMiss}ms`);
  console.log(`Average cache HIT  (Redis):   ${avgHit}ms`);
  console.log(`Improvement: ${improvement}% faster with caching`);
  console.log('=============================');
  console.log(`\n✅ Use this in your resume: "Reduced API response time by ${improvement}% using Redis caching"`);
}

runTest();