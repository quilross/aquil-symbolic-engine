#!/usr/bin/env node

/**
 * OpenAPI Audit Script
 * Validates the OpenAPI specification for Signal Q API
 * This script runs early in CI/CD before firewall restrictions
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Starting OpenAPI Audit...');

// Load OpenAPI spec
const specPath = path.join(__dirname, 'worker', 'src', 'openapi-core.json');

if (!fs.existsSync(specPath)) {
    console.error('❌ OpenAPI spec file not found:', specPath);
    process.exit(1);
}

try {
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    
    console.log('✅ OpenAPI spec loaded successfully');
    console.log('📋 API Info:');
    console.log(`   Title: ${spec.info?.title || 'Unknown'}`);
    console.log(`   Version: ${spec.info?.version || 'Unknown'}`);
    console.log(`   Base URL: ${spec.servers?.[0]?.url || 'Not specified'}`);
    
    // Basic validation checks
    const errors = [];
    
    // Check required fields
    if (!spec.openapi) errors.push('Missing openapi version');
    if (!spec.info) errors.push('Missing info section');
    if (!spec.paths) errors.push('Missing paths section');
    
    // Check server URL matches expected domain
    const expectedDomain = 'signal_q.catnip-pieces1.workers.dev';
    const serverUrl = spec.servers?.[0]?.url;
    if (serverUrl && !serverUrl.includes(expectedDomain)) {
        errors.push(`Server URL does not contain expected domain: ${expectedDomain}`);
    }
    
    // Check for security definitions
    if (!spec.components?.securitySchemes) {
        errors.push('Missing security schemes');
    }
    
    // Check for health endpoint
    if (!spec.paths['/system/health']) {
        errors.push('Missing required /system/health endpoint');
    }
    
    if (errors.length > 0) {
        console.error('❌ OpenAPI validation failed:');
        errors.forEach(error => console.error(`   - ${error}`));
        process.exit(1);
    }
    
    console.log('✅ OpenAPI audit completed successfully');
    console.log(`📊 Found ${Object.keys(spec.paths).length} endpoints`);
    
} catch (error) {
    console.error('❌ OpenAPI audit failed:', error.message);
    process.exit(1);
}