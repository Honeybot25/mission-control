#!/usr/bin/env node
/**
 * Environment Setup Helper
 * Run this to check that required env vars are set
 */

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

const optional = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID'
];

console.log('🔧 Mission Control - Environment Check\n');

let missing = [];
for (const key of required) {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${key}: NOT SET (required)`);
    missing.push(key);
  }
}

for (const key of optional) {
  const value = process.env[key];
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`⚠️  ${key}: not set (optional)`);
  }
}

if (missing.length > 0) {
  console.log(`\n❌ Missing required env vars: ${missing.join(', ')}`);
  console.log('Create a .env file with these values from your Supabase dashboard.');
  process.exit(1);
}

console.log('\n✅ All required environment variables are set!');
