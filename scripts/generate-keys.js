#!/usr/bin/env node
/**
 * License key generator for Fee Manager Pro (TechBySoul)
 * Usage: node scripts/generate-keys.js [count]
 *
 * Key format: XXXX-HGA-AS
 * XXXX = 4-char base-36 prefix validated by HMAC-SHA256
 */
const { createHmac } = require('crypto')

const LICENSE_SECRET = 'tbs-fma-2024@coaching-hga'
const COUNT = parseInt(process.argv[2]) || 20

let generated = 0
const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'

console.log('Fee Manager Pro — License Keys')
console.log('================================')

for (let i = 0; i < Math.pow(36, 4) && generated < COUNT; i++) {
  // Build 4-char base-36 string
  let n = i
  let xxxx = ''
  for (let j = 0; j < 4; j++) {
    xxxx = chars[n % 36] + xxxx
    n = Math.floor(n / 36)
  }

  const hash = createHmac('sha256', LICENSE_SECRET).update(xxxx).digest('hex')
  // ~1/16 of all possible prefixes are valid (first hex digit must be 'a')
  if (hash[0] === 'a') {
    console.log(`${xxxx}-HGA-AS`)
    generated++
  }
}

console.log(`\n${generated} key(s) generated.`)
