#!/usr/bin/env node
/**
 * Fix try/catch block consistency in index.js
 * Normalizes catch blocks to use consistent syntax
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🔧 FIXING TRY/CATCH BLOCK CONSISTENCY');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

function fixTryCatchBlocks() {
  const indexPath = path.join(rootDir, 'src/index.js');
  let content = fs.readFileSync(indexPath, 'utf8');
  
  // Create backup
  const backupPath = indexPath + '.backup';
  fs.writeFileSync(backupPath, content);
  console.log(`💾 Backup created: ${backupPath}`);
  
  // Count original blocks
  const originalTryBlocks = (content.match(/try\s*{/g) || []).length;
  const originalCatchBlocks = (content.match(/catch\s*[\(\{]/g) || []).length;
  
  console.log(`📊 Original: ${originalTryBlocks} try blocks, ${originalCatchBlocks} catch blocks`);
  
  // Fix catch blocks without parentheses - normalize to use error parameter
  content = content.replace(/} catch \{ return ([^}]+) \}/g, '} catch (error) { return $1 }');
  content = content.replace(/} catch \{\}/g, '} catch (error) {}');
  
  // Count after fixes
  const newTryBlocks = (content.match(/try\s*{/g) || []).length;
  const newCatchBlocks = (content.match(/catch\s*\(/g) || []).length;
  
  console.log(`📊 After fix: ${newTryBlocks} try blocks, ${newCatchBlocks} catch blocks`);
  
  if (newTryBlocks === newCatchBlocks) {
    fs.writeFileSync(indexPath, content);
    console.log('✅ Try/catch blocks are now balanced');
    return true;
  } else {
    console.log('⚠️  Still unbalanced - this may be due to nested structures or async/await patterns');
    console.log('   This is not necessarily an error in modern JavaScript');
    return false;
  }
}

// Run the fix
try {
  fixTryCatchBlocks();
  console.log('\n🎉 Try/catch block consistency check completed');
} catch (error) {
  console.error(`❌ Fix failed: ${error.message}`);
  process.exit(1);
}