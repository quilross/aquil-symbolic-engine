#!/usr/bin/env node
/**
 * Fix Try/Catch Block Mismatches
 * Identifies and fixes unmatched try/catch blocks in src/index.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

function analyzeAndFixTryCatchBlocks() {
  console.log('🔧 ANALYZING TRY/CATCH BLOCK ALIGNMENT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const indexPath = path.join(rootDir, 'src/index.js');
  const content = fs.readFileSync(indexPath, 'utf8');
  const lines = content.split('\n');
  
  const tryBlocks = [];
  const catchBlocks = [];
  
  // Find all try and catch blocks with line numbers
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmedLine = line.trim();
    
    if (/try\s*{/.test(trimmedLine)) {
      tryBlocks.push({
        lineNumber,
        line: trimmedLine,
        context: lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join('\n')
      });
    }
    
    if (/catch\s*\(/.test(trimmedLine) || /}\s*catch\s*{/.test(trimmedLine)) {
      catchBlocks.push({
        lineNumber,
        line: trimmedLine,
        context: lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 3)).join('\n')
      });
    }
  });
  
  console.log(`📊 Found ${tryBlocks.length} try blocks and ${catchBlocks.length} catch blocks`);
  
  // Identify problematic patterns
  const problematicTryBlocks = [];
  
  // Look for try blocks that might be missing catch
  tryBlocks.forEach(tryBlock => {
    const linesAfterTry = lines.slice(tryBlock.lineNumber, Math.min(lines.length, tryBlock.lineNumber + 10));
    const hasCatch = linesAfterTry.some(line => /catch\s*\(/.test(line) || /}\s*catch\s*{/.test(line));
    
    if (!hasCatch) {
      // Check if it's a simple one-liner that might need a catch
      const tryLine = lines[tryBlock.lineNumber - 1];
      if (tryLine.includes('try { return') || tryLine.includes('try {') && tryLine.includes('}')) {
        problematicTryBlocks.push({
          ...tryBlock,
          issue: 'Missing catch for one-liner try block',
          suggestedFix: tryLine.replace(/try\s*{([^}]+)}\s*/, 'try { $1 } catch { /* Handle error */ }')
        });
      } else {
        problematicTryBlocks.push({
          ...tryBlock,
          issue: 'Try block without corresponding catch',
          suggestedFix: 'Add catch block after the closing brace'
        });
      }
    }
  });
  
  console.log(`\n⚠️  Found ${problematicTryBlocks.length} problematic try blocks:`);
  
  let newContent = content;
  let fixesApplied = 0;
  
  // Fix one-liner try blocks that are missing catch
  problematicTryBlocks.forEach(block => {
    if (block.issue === 'Missing catch for one-liner try block') {
      console.log(`\n🔧 Fixing line ${block.lineNumber}: ${block.line}`);
      console.log(`   → ${block.suggestedFix}`);
      
      const oldLine = lines[block.lineNumber - 1];
      
      // Handle specific patterns
      if (oldLine.includes('try { return') && oldLine.includes('} catch { return')) {
        // Already has catch, might be false positive
        console.log(`   ✅ Already has catch, skipping`);
      } else if (oldLine.includes('try { return') && !oldLine.includes('catch')) {
        // Missing catch for return statement
        const newLine = oldLine.replace(/try\s*{\s*return([^}]+)}\s*/, 'try { return$1 } catch { return null }');
        newContent = newContent.replace(oldLine, newLine);
        fixesApplied++;
        console.log(`   ✅ Applied fix`);
      } else if (oldLine.includes('try {') && oldLine.includes('}') && !oldLine.includes('catch')) {
        // Generic one-liner try block
        const newLine = oldLine.replace(/try\s*{([^}]+)}\s*/, 'try { $1 } catch (error) { /* Error handled */ }');
        newContent = newContent.replace(oldLine, newLine);
        fixesApplied++;
        console.log(`   ✅ Applied fix`);
      }
    }
  });
  
  // Also look for catch blocks that might be orphaned
  const orphanedCatchBlocks = [];
  catchBlocks.forEach(catchBlock => {
    const linesBefore = lines.slice(Math.max(0, catchBlock.lineNumber - 10), catchBlock.lineNumber - 1);
    const hasTry = linesBefore.some(line => /try\s*{/.test(line));
    
    if (!hasTry) {
      orphanedCatchBlocks.push(catchBlock);
    }
  });
  
  if (orphanedCatchBlocks.length > 0) {
    console.log(`\n⚠️  Found ${orphanedCatchBlocks.length} potentially orphaned catch blocks:`);
    orphanedCatchBlocks.forEach(block => {
      console.log(`   Line ${block.lineNumber}: ${block.line}`);
    });
  }
  
  // Write the fixed content if any changes were made
  if (fixesApplied > 0) {
    fs.writeFileSync(indexPath, newContent);
    console.log(`\n✅ Applied ${fixesApplied} fixes to try/catch blocks`);
    
    // Verify the fix
    const newTryCount = (newContent.match(/\btry\s*{/g) || []).length;
    const newCatchCount = (newContent.match(/\bcatch\s*\(/g) || []).length;
    console.log(`\n📊 After fixes:`);
    console.log(`   Try blocks: ${newTryCount}`);
    console.log(`   Catch blocks: ${newCatchCount}`);
    console.log(`   Difference: ${Math.abs(newTryCount - newCatchCount)}`);
  } else {
    console.log(`\n✅ No automatic fixes could be applied`);
    console.log(`   Manual review may be needed for remaining mismatches`);
  }
  
  return fixesApplied;
}

// Main execution
try {
  const fixesApplied = analyzeAndFixTryCatchBlocks();
  process.exit(0);
} catch (error) {
  console.error('❌ Error analyzing try/catch blocks:', error.message);
  process.exit(1);
}