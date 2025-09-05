#!/usr/bin/env node
/**
 * Ark 2.0 Data Architecture Schema Validator
 * Validates JSON schema files for compliance with Ark 2.0 specifications
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// UUID v4 validation regex
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ISO 8601 validation regex
const ISO_8601_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;

function validateSchema(filename, validatorFn) {
  try {
    const data = JSON.parse(readFileSync(join('schemas', filename), 'utf8'));
    const results = validatorFn(data);
    
    console.log(`\n🔍 ${filename}`);
    results.forEach(result => {
      console.log(result.pass ? '✅' : '❌', result.message);
    });
    
    return results.every(r => r.pass);
  } catch (error) {
    console.log(`\n❌ ${filename}: ${error.message}`);
    return false;
  }
}

function validateLogs(data) {
  return [
    { pass: Array.isArray(data.logs), message: 'logs is an array' },
    { pass: data.logs.length === 0, message: 'logs array is empty (as required)' },
    { pass: typeof data.retrieval === 'object', message: 'retrieval object exists' },
    { pass: data.retrieval.lastRetrieved === null, message: 'lastRetrieved is null' },
    { pass: data.retrieval.retrievalCount === 0, message: 'retrievalCount is 0' }
  ];
}

function validateCommitments(data) {
  const commitment = data.commitments[0];
  return [
    { pass: Array.isArray(data.commitments), message: 'commitments is an array' },
    { pass: data.commitments.length === 1, message: 'has one example commitment' },
    { pass: UUID_V4_REGEX.test(commitment.id), message: 'commitment ID is valid UUID v4' },
    { pass: ISO_8601_REGEX.test(commitment.createdAt), message: 'createdAt is valid ISO 8601' },
    { pass: !!commitment.description, message: 'has description' },
    { pass: commitment.status === 'pending', message: 'status is pending' },
    { pass: Array.isArray(commitment.progressUpdates), message: 'progressUpdates is array' }
  ];
}

function validateArtifacts(data) {
  const artifact = data.artifacts[0];
  return [
    { pass: Array.isArray(data.artifacts), message: 'artifacts is an array' },
    { pass: data.artifacts.length === 1, message: 'has one example artifact' },
    { pass: UUID_V4_REGEX.test(artifact.id), message: 'artifact ID is valid UUID v4' },
    { pass: ISO_8601_REGEX.test(artifact.createdAt), message: 'createdAt is valid ISO 8601' },
    { pass: !!artifact.name, message: 'has name' },
    { pass: !!artifact.type, message: 'has type' },
    { pass: !!artifact.r2Key, message: 'has r2Key' },
    { pass: typeof artifact.data === 'object', message: 'data is flexible object' }
  ];
}

function validateVector(data) {
  const pattern = data.patterns[0];
  return [
    { pass: Array.isArray(data.patterns), message: 'patterns is an array' },
    { pass: data.patterns.length === 1, message: 'has one example pattern' },
    { pass: UUID_V4_REGEX.test(pattern.id), message: 'pattern ID is valid UUID v4' },
    { pass: ISO_8601_REGEX.test(pattern.createdAt), message: 'createdAt is valid ISO 8601' },
    { pass: Array.isArray(pattern.embedding), message: 'embedding is array' },
    { pass: !!pattern.source, message: 'has source' },
    { pass: typeof pattern.metadata === 'object', message: 'metadata is object' },
    { pass: !!pattern.metadata.theme, message: 'metadata has theme' },
    { pass: typeof pattern.metadata.confidence === 'number', message: 'metadata has confidence number' }
  ];
}

// Run validation
console.log('🚀 Ark 2.0 Schema Validation');
console.log('===============================');

const results = [
  validateSchema('logs.json', validateLogs),
  validateSchema('commitments.json', validateCommitments),
  validateSchema('artifacts.json', validateArtifacts),
  validateSchema('vector.json', validateVector)
];

const allPassed = results.every(r => r);
console.log('\n' + '='.repeat(31));
console.log(allPassed ? '🎉 All schemas valid!' : '❌ Some schemas have issues');

process.exit(allPassed ? 0 : 1);