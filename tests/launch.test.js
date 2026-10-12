import test from 'node:test';
import assert from 'node:assert/strict';
import { demoModeEnabled } from '../src/utils/demoMode.js';
import { validRecoveryIntent, recoveryIntentForEvent } from '../src/utils/recoveryIntent.js';
import { BUNDLED_CATALOG_PRODUCTS } from '../src/data/bundledCatalog.js';

test('production cannot enable demo data; staging requires explicit opt-in', () => {
  for (const env of ['production','preview',undefined,'']) assert.equal(demoModeEnabled(env,'true'),false);
  assert.equal(demoModeEnabled('staging','true'),true);
  assert.equal(demoModeEnabled('staging',undefined),false);
});
test('demos do not claim product verification, rights, stock or downloads', () => {
  for (const product of BUNDLED_CATALOG_PRODUCTS) {
    assert.equal(product.is_demo,true);
    assert.equal(product.rights_confirmed,false);
    assert.equal(product.verification_status,'unverified');
    assert.equal(product.in_stock,null);
    assert.equal(product.license_download,false);
    assert.deepEqual(product.product_files,[]);
  }
});
test('ordinary sessions never establish password recovery intent', () => {
  const session = { user: { id:'a' }, access_token: 'eyJ.'+btoa(JSON.stringify({session_id:'recovery-a'}))+'.signature' };
  for (const event of ['INITIAL_SESSION','SIGNED_IN','TOKEN_REFRESHED']) {
    assert.equal(recoveryIntentForEvent(event,session,null,100),null);
  }
});
test('recovery intent is bound to identity, expires and clears on a new session/sign-out', () => {
  const session = { user: { id:'a' }, access_token: 'eyJ.'+btoa(JSON.stringify({session_id:'recovery-a'}))+'.signature' };
  const intent = recoveryIntentForEvent('PASSWORD_RECOVERY',session,null,100);
  assert.equal(validRecoveryIntent(intent,session,101),true);
  assert.equal(validRecoveryIntent(intent,{user:{id:'b'}},101),false);
  assert.equal(validRecoveryIntent(intent,session,600100),false);
  assert.equal(validRecoveryIntent(intent,session,99),false);
  assert.deepEqual(recoveryIntentForEvent('SIGNED_IN',session,intent,101),intent);
  assert.equal(recoveryIntentForEvent('SIGNED_IN',{...session,access_token:'eyJ.'+btoa(JSON.stringify({session_id:'new-session'}))+'.signature'},intent,101),null);
  assert.equal(recoveryIntentForEvent('SIGNED_OUT',null,intent,101),null);
  assert.deepEqual(recoveryIntentForEvent('INITIAL_SESSION',session,intent,101),intent);
});

import { validateReleaseConfig } from '../src/utils/releaseConfig.js';
test('release gate rejects staging backend, demos and privileged browser keys', () => {
  const env = { VITE_SUPABASE_URL:'https://uhcvfwajowdszxteanlx.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY:'sb_secret_bad', VITE_APP_URL:'https://staging.example', VITE_DEMO_MODE:'true' };
  assert.ok(validateReleaseConfig(env,true).length>=4);
  const jwt = 'eyJ.'+btoa(JSON.stringify({role:'service_role'}))+'.signature';
  assert.ok(validateReleaseConfig({VITE_SUPABASE_ANON_KEY:jwt}).length);
});
