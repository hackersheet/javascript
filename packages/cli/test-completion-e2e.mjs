#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cliPath = path.join(__dirname, 'dist', 'cli.mjs');

/**
 * Test completion with environment variables
 */
async function testCompletion(name, env) {
  return new Promise((resolve) => {
    const output = [];
    const proc = spawn('node', [cliPath], {
      env: { ...process.env, ...env },
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    proc.stdout.on('data', (data) => {
      output.push(data.toString().trim());
    });

    proc.on('close', () => {
      console.log(`\n📋 Test: ${name}`);
      console.log(`   Environment: COMP_CWORD=${env.COMP_CWORD}, COMP_LINE="${env.COMP_LINE}"`);
      console.log(`   Output:`);
      output.forEach((line) => {
        if (line) console.log(`     ${line}`);
      });
      resolve();
    });
  });
}

/**
 * Run all completion tests
 */
async function runTests() {
  console.log('🧪 Shell Completion E2E Tests\n');
  console.log('='.repeat(50));

  // Test 1: Default command completion
  await testCompletion('Default command completion', {
    COMP_CWORD: '1',
    COMP_LINE: 'hscli ',
    COMP_POINT: '6',
  });

  // Test 2: docs command completion (without workspace config)
  await testCompletion('docs command completion (no workspace)', {
    COMP_CWORD: '2',
    COMP_LINE: 'hscli docs ',
    COMP_POINT: '11',
  });

  // Test 3: Command with partial input
  await testCompletion('Partial command completion', {
    COMP_CWORD: '1',
    COMP_LINE: 'hscli c',
    COMP_POINT: '7',
  });

  // Test 4: Workspace option completion
  await testCompletion('Workspace option completion', {
    COMP_CWORD: '3',
    COMP_LINE: 'hscli docs -w ',
    COMP_POINT: '14',
  });

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed\n');
}

runTests().catch(console.error);
