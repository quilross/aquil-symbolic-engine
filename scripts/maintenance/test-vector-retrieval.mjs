#!/usr/bin/env node

/**
 * Vector Retrieval Testing Script
 * Tests vector logging, storage, and retrieval functionality
 */

import { execSync } from 'child_process';

const ENDPOINT = 'http://localhost:8787';

async function testVectorRetrieval() {
  console.log('🔍 VECTOR RETRIEVAL TESTING');
  console.log('================================\n');

  const testResults = {
    upsert: { success: 0, failed: 0 },
    query: { success: 0, failed: 0 },
    retrieval: { complete: 0, partial: 0, failed: 0 }
  };

  // Test 1: Upsert test vectors
  console.log('📤 Testing Vector Upsert...');
  const testLogs = [
    { text: "I'm feeling anxious about the upcoming presentation", type: "trust_check_in" },
    { text: "Had a breakthrough in my creative writing today", type: "creativity_session" },
    { text: "Body tension in shoulders after long day", type: "somatic_awareness" }
  ];

  for (const [index, testLog] of testLogs.entries()) {
    try {
      const response = await fetch(`${ENDPOINT}/api/vectorize/upsert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: `test_vector_${Date.now()}_${index}`,
          text: testLog.text,
          metadata: {
            type: testLog.type,
            test: true,
            timestamp: new Date().toISOString()
          }
        })
      });

      const result = await response.json();
      if (result.ok) {
        testResults.upsert.success++;
        console.log(`  ✅ Upserted: ${testLog.type}`);
      } else {
        testResults.upsert.failed++;
        console.log(`  ❌ Failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      testResults.upsert.failed++;
      console.log(`  ❌ Exception: ${error.message}`);
    }
  }

  // Wait for indexing
  console.log('\n⏳ Waiting for vector indexing...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Query vectors with different modes
  console.log('\n🔍 Testing Vector Queries...');
  const testQueries = [
    { text: "anxiety about presentations", mode: "semantic_recall" },
    { text: "creative breakthrough", mode: "transformative_inquiry" },
    { text: "body tension shoulders", mode: "semantic_recall", threshold: 0.5 }
  ];

  for (const query of testQueries) {
    try {
      const response = await fetch(`${ENDPOINT}/api/vectorize/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(query)
      });

      const result = await response.json();
      if (result.success) {
        testResults.query.success++;
        console.log(`  ✅ Query "${query.text}" (${query.mode})`);
        console.log(`     Found: ${result.total_found || result.matches?.length || 0} matches`);
        
        // Check retrieval quality
        if (result.matches) {
          for (const match of result.matches) {
            if (match.retrieval_status === 'complete') {
              testResults.retrieval.complete++;
            } else if (match.retrieval_status === 'partial') {
              testResults.retrieval.partial++;
            } else {
              testResults.retrieval.failed++;
            }
          }
        }
        
        // Show debug info if available
        if (result.debug) {
          console.log(`     Debug: Vector=${result.debug.vector_store}, KV=${result.debug.kv_store}, D1=${result.debug.d1_store}`);
        }
        
        if (result.retrieval_summary) {
          console.log(`     Retrieval: ${result.retrieval_summary.successful} complete, ${result.retrieval_summary.partial} partial`);
        }
      } else {
        testResults.query.failed++;
        console.log(`  ❌ Query failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      testResults.query.failed++;
      console.log(`  ❌ Exception: ${error.message}`);
    }
  }

  // Test 3: Log retrieval endpoint
  console.log('\n📊 Testing Log Retrieval...');
  try {
    const response = await fetch(`${ENDPOINT}/api/logs/read?limit=5`);
    const result = await response.json();
    
    if (result.vector) {
      console.log(`  ✅ Vector logs status: ${result.vector.status || JSON.stringify(result.vector)}`);
    } else {
      console.log('  ⚠️  No vector info in logs endpoint');
    }
  } catch (error) {
    console.log(`  ❌ Logs endpoint error: ${error.message}`);
  }

  // Results Summary
  console.log('\n📈 TEST RESULTS SUMMARY');
  console.log('=======================');
  console.log(`Vector Upsert: ${testResults.upsert.success} success, ${testResults.upsert.failed} failed`);
  console.log(`Vector Query: ${testResults.query.success} success, ${testResults.query.failed} failed`);
  console.log(`Log Retrieval: ${testResults.retrieval.complete} complete, ${testResults.retrieval.partial} partial, ${testResults.retrieval.failed} failed`);
  
  const totalTests = testResults.upsert.success + testResults.upsert.failed + 
                    testResults.query.success + testResults.query.failed;
  const totalSuccess = testResults.upsert.success + testResults.query.success;
  
  console.log(`\nOverall: ${totalSuccess}/${totalTests} tests passed`);
  
  if (testResults.retrieval.failed > 0 || testResults.query.failed > 0) {
    console.log('\n⚠️  ISSUES DETECTED:');
    if (testResults.query.failed > 0) {
      console.log('  - Vector queries failing');
    }
    if (testResults.retrieval.failed > 0) {
      console.log('  - Log content retrieval failing');
    }
    console.log('\n💡 Suggested actions:');
    console.log('  1. Check Cloudflare bindings (AQUIL_CONTEXT, AQUIL_MEMORIES, AQUIL_DB)');
    console.log('  2. Verify vector indexing is working');
    console.log('  3. Check KV/D1 store connectivity for log retrieval');
  } else {
    console.log('\n✅ All vector retrieval functionality working correctly!');
  }
}

// Run the test
testVectorRetrieval().catch(console.error);
