#!/usr/bin/env node
const crypto = require('crypto');
const token = crypto.randomBytes(16).toString('hex');
const password = crypto.randomBytes(10).toString('hex');
const hash = crypto.createHash('sha256').update(`plantadmin:${password}`).digest('hex');
console.log('\n🌳 MB Plant House Admin Setup\n');
console.log('Add these to your .env.local:\n');
console.log(`ADMIN_TOKEN=${token}`);
console.log(`ADMIN_PASSWORD_HASH=${hash}\n`);
console.log('Your password (save this — shown only once):');
console.log(`Password: ${password}\n`);
console.log('Admin URL: /admin  (or press Ctrl+Shift+A on the site)\n');
