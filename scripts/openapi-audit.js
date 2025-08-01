#!/usr/bin/env node

/**
 * OpenAPI Audit Script
 * Validates OpenAPI specification against implementation
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 OpenAPI Audit Starting...\n');

async function auditOpenAPISpec() {
  try {
    // Load OpenAPI spec
    const specPath = path.join(__dirname, '../worker/src/openapi-core.json');
    
    if (!fs.existsSync(specPath)) {
      console.log('❌ OpenAPI spec file not found at:', specPath);
      process.exit(1);
    }

    const specContent = fs.readFileSync(specPath, 'utf8');
    const spec = JSON.parse(specContent);

    console.log('✅ OpenAPI spec loaded successfully');
    console.log(`📊 API Version: ${spec.info?.version || 'unknown'}`);
    console.log(`📝 Title: ${spec.info?.title || 'unknown'}`);
    
    // Count endpoints
    const pathCount = Object.keys(spec.paths || {}).length;
    console.log(`🛣️  Endpoint count: ${pathCount}`);

    // Validate security schemes
    const securitySchemes = spec.components?.securitySchemes || {};
    const hasBearer = securitySchemes.bearerAuth?.type === 'http' && 
                      securitySchemes.bearerAuth?.scheme === 'bearer';
    
    if (hasBearer) {
      console.log('🔐 Bearer authentication properly configured');
    } else {
      console.log('⚠️  Bearer authentication configuration missing or incorrect');
    }

    // Check for required endpoints mentioned in problem statement
    const requiredEndpoints = ['/system/health'];
    const missingEndpoints = requiredEndpoints.filter(endpoint => 
      !spec.paths || !spec.paths[endpoint]
    );

    if (missingEndpoints.length === 0) {
      console.log('✅ All required endpoints present in OpenAPI spec');
    } else {
      console.log('⚠️  Missing endpoints in OpenAPI spec:', missingEndpoints);
    }

    console.log('\n📋 OpenAPI Audit Summary:');
    console.log('='.repeat(40));
    console.log(`✅ Spec valid: ${pathCount > 0 ? 'YES' : 'NO'}`);
    console.log(`🔐 Auth configured: ${hasBearer ? 'YES' : 'NO'}`);
    console.log(`🛣️  Required endpoints: ${missingEndpoints.length === 0 ? 'YES' : 'NO'}`);
    
    if (missingEndpoints.length === 0 && hasBearer && pathCount > 0) {
      console.log('\n🎉 OpenAPI audit PASSED');
      return true;
    } else {
      console.log('\n⚠️  OpenAPI audit found issues');
      return false;
    }

  } catch (error) {
    console.log('❌ OpenAPI audit failed:', error.message);
    return false;
  }
}

// Run audit
auditOpenAPISpec()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Audit script failed:', error);
    process.exit(1);
  });