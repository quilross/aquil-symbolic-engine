#!/usr/bin/env node

/**
 * Aquil Symbolic Engine Setup Script
 * Creates Cloudflare resources and updates configuration
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

console.log('🌱 Setting up Aquil Symbolic Engine...\n');

async function setup() {
  try {
    // Step 1: Create D1 Database
    console.log('📊 Creating D1 database...');
    const dbResult = execSync('wrangler d1 create aquil-wisdom-db', { encoding: 'utf8' });
    console.log(dbResult);
    
    const dbIdMatch = dbResult.match(/database_id = "([^"]+)"/);
    const dbId = dbIdMatch ? dbIdMatch[1] : null;
    
    if (!dbId) {
      console.error('❌ Could not extract database ID from wrangler output');
      console.log('Manual step: Copy the database_id from above and update wrangler.toml');
      return;
    }
    
    // Step 2: Create KV Namespace
    console.log('\n💾 Creating KV namespace...');
    const kvResult = execSync('wrangler kv:namespace create "AQUIL_MEMORIES"', { encoding: 'utf8' });
    console.log(kvResult);
    
    const kvIdMatch = kvResult.match(/id = "([^"]+)"/);
    const kvId = kvIdMatch ? kvIdMatch[1] : null;
    
    // Step 3: Create KV Preview Namespace
    console.log('\n💾 Creating KV preview namespace...');
    const kvPreviewResult = execSync('wrangler kv:namespace create "AQUIL_MEMORIES" --preview', { encoding: 'utf8' });
    console.log(kvPreviewResult);
    
    const kvPreviewIdMatch = kvPreviewResult.match(/preview_id = "([^"]+)"/);
    const kvPreviewId = kvPreviewIdMatch ? kvPreviewIdMatch[1] : null;
    
    // Step 4: Update wrangler.toml with actual IDs
    if (dbId && kvId && kvPreviewId) {
      console.log('\n📝 Updating wrangler.toml with resource IDs...');
      
      let wranglerConfig = readFileSync('wrangler.toml', 'utf8');
      wranglerConfig = wranglerConfig.replace('REPLACE_WITH_ACTUAL_DATABASE_ID', dbId);
      wranglerConfig = wranglerConfig.replace('REPLACE_WITH_ACTUAL_KV_ID', kvId);
      wranglerConfig = wranglerConfig.replace('REPLACE_WITH_ACTUAL_KV_PREVIEW_ID', kvPreviewId);
      wranglerConfig = wranglerConfig.replace('REPLACE_WITH_DEV_DATABASE_ID', dbId);
      wranglerConfig = wranglerConfig.replace('REPLACE_WITH_DEV_KV_ID', kvId);
      
      writeFileSync('wrangler.toml', wranglerConfig);
      console.log('✅ wrangler.toml updated with resource IDs');
      
      // Step 5: Initialize database schema
      console.log('\n🗄️  Initializing database schema...');
      execSync('wrangler d1 execute AQUIL_DB --file=schema.sql --env production');
      console.log('✅ Database schema initialized');
      
      console.log('\n🎉 Setup complete!');
      console.log('\nNext steps:');
      console.log('1. Run: npm run deploy');
      console.log('2. Test: curl https://signal-q.me/api/health');
      console.log('3. Create your ChatGPT GPT with the actions schema');
      console.log('\nWelcome home to yourself, Aquil! 🌱');
      
    } else {
      console.log('\n⚠️  Could not extract all resource IDs automatically.');
      console.log('Please manually update wrangler.toml with the IDs shown above.');
      console.log('\nResource IDs found:');
      console.log(`Database ID: ${dbId || 'NOT_FOUND'}`);
      console.log(`KV ID: ${kvId || 'NOT_FOUND'}`);
      console.log(`KV Preview ID: ${kvPreviewId || 'NOT_FOUND'}`);
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\nManual setup required. Please run:');
    console.log('1. wrangler d1 create aquil-wisdom-db');
    console.log('2. wrangler kv:namespace create "AQUIL_MEMORIES"');
    console.log('3. wrangler kv:namespace create "AQUIL_MEMORIES" --preview');
    console.log('4. Update wrangler.toml with the returned IDs');
    console.log('5. wrangler d1 execute AQUIL_DB --file=schema.sql --env production');
  }
}

setup();
