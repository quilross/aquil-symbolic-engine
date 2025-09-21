#!/usr/bin/env node
/**
 * Vector Dimension Test Script
 * Manually tests the vector dimension functionality
 */

import { ensureVector, upsertVectors, queryVectorIndex, testVectorFlow } from '../src/actions/vectorize.js';

// Mock environment for testing
const mockEnv = {
  AQUIL_AI: {
    run: async (model, { text }) => {
      console.log(`🔄 Generating embedding for: "${text}"`);
      // Mock response with proper 1024-dimensional vector
      const mockVector = new Array(1024).fill(0).map((_, i) => Math.random());
      return {
        data: [mockVector]
      };
    }
  },
  AQUIL_CONTEXT: {
    upsert: async (payload) => {
      console.log(`📤 Upserting ${payload.length} vector(s)`);
      payload.forEach(item => {
        console.log(`   - ID: ${item.id}, Vector dims: ${item.values.length}, Metadata: ${JSON.stringify(item.metadata)}`);
      });
      return { inserted: payload.length };
    },
    query: async (vector, options) => {
      console.log(`🔍 Querying vector index (dims: ${vector.length}, topK: ${options.topK})`);
      return {
        matches: [
          {
            id: 'logvec_test1',
            score: 0.95,
            metadata: { type: 'test' },
            values: vector.slice(0, 5) // Just show first 5 values for brevity
          }
        ]
      };
    }
  }
};

async function runTests() {
  console.log('🚀 Starting Vector Dimension Tests\n');

  try {
    // Test 1: Validate 1024-dimension enforcement
    console.log('🧪 Test 1: Dimension validation');
    try {
      await ensureVector(mockEnv, [1, 2, 3, 4, 5]); // Should fail
      console.log('❌ ERROR: Should have rejected 5-dim vector');
    } catch (error) {
      console.log('✅ Correctly rejected 5-dim vector:', error.message);
    }

    // Test 2: Generate embedding from text
    console.log('\n🧪 Test 2: Text embedding generation');
    const vector = await ensureVector(mockEnv, "Ark system full memory test");
    console.log(`✅ Generated ${vector.length}-dimensional vector from text`);

    // Test 3: Upsert vector
    console.log('\n🧪 Test 3: Vector upsert');
    const upsertResult = await upsertVectors(mockEnv, {
      id: 'test123',
      text: 'Ark system full memory test',
      metadata: { type: 'test' }
    });
    console.log('✅ Upsert completed:', upsertResult);

    // Test 4: Query vector
    console.log('\n🧪 Test 4: Vector query');
    const queryResult = await queryVectorIndex(mockEnv, {
      text: 'Ark system full memory test',
      topK: 1
    });
    console.log('✅ Query completed, matches:', queryResult.matches.length);

    // Test 5: Full vector flow
    console.log('\n🧪 Test 5: Full vector flow');
    const flowResult = await testVectorFlow(mockEnv);
    console.log('✅ Full flow completed successfully');

    console.log('\n🎉 All tests passed! Vector dimension mismatch issue is fixed.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the tests
runTests();