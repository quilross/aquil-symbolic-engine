#!/usr/bin/env node
/**
 * GPT_COMPAT_MODE Demonstration Script
 * Shows how the system behaves with and without GPT_COMPAT_MODE enabled
 */

import { isGPTCompatMode, safeBinding, safeOperation, safeLog } from '../src/utils/gpt-compat.js';

console.log('🧪 GPT_COMPAT_MODE Demonstration\n');

// Test 1: Basic detection
console.log('1. Mode Detection:');
console.log('   Normal mode:', isGPTCompatMode({ GPT_COMPAT_MODE: false }));
console.log('   Compat mode:', isGPTCompatMode({ GPT_COMPAT_MODE: true }));
console.log('   Compat mode (string):', isGPTCompatMode({ GPT_COMPAT_MODE: 'true' }));
console.log();

// Test 2: Safe binding behavior
console.log('2. Safe Binding Behavior:');
const normalEnv = { GPT_COMPAT_MODE: false };
const compatEnv = { GPT_COMPAT_MODE: true };

console.log('   Normal mode - missing binding:', safeBinding(normalEnv, 'AQUIL_DB')); // undefined
console.log('   Compat mode - missing binding:', safeBinding(compatEnv, 'AQUIL_DB')); // null
console.log();

// Test 3: Safe operation behavior
console.log('3. Safe Operation Behavior:');

const failingOp = () => Promise.reject(new Error('Database connection failed'));

try {
  await safeOperation(normalEnv, failingOp, 'fallback');
  console.log('   Normal mode: Should not reach here');
} catch (error) {
  console.log('   Normal mode - failing op: throws error ✓');
}

const compatResult = await safeOperation(compatEnv, failingOp, 'fallback');
console.log('   Compat mode - failing op:', compatResult); // 'fallback'
console.log();

// Test 4: Safe logging behavior
console.log('4. Safe Logging Behavior:');

const failingLog = () => Promise.reject(new Error('Logging service unavailable'));

try {
  await safeLog(normalEnv, failingLog);
  console.log('   Normal mode: Should not reach here');
} catch (error) {
  console.log('   Normal mode - failing log: throws error ✓');
}

const logResult = await safeLog(compatEnv, failingLog);
console.log('   Compat mode - failing log: returns', logResult); // false
console.log();

console.log('✅ GPT_COMPAT_MODE provides fail-open behavior for ChatGPT usage!');