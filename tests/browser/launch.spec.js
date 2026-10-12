import { test, expect } from '@playwright/test';
import { Buffer } from 'node:buffer';
const owner='22222222-2222-4222-8222-222222222222';
const session={access_token:'eyJ.'+btoa(JSON.stringify({session_id:'synthetic-session'}))+'.signature',refresh_token:'isolated-refresh',token_type:'bearer',expires_at:4102444800,
 user:{id:owner,email:'isolated@example.invalid',aud:'authenticated',role:'authenticated',user_metadata:{}}};
async function fixture(page,role='user',userType='general_user') {
 await page.addInitScript(({session})=>{
   localStorage.setItem('buod_language','en');
   if (!localStorage.getItem('sb-workspace-fixture-auth-token')) localStorage.setItem('sb-workspace-fixture-auth-token',JSON.stringify(session));
 },{session});
 await page.route('https://*.supabase.co/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname.endsWith('/profiles')) {
     const profile={id:owner,full_name:'Isolated User',role,user_type:userType};
     return route.fulfill({json:url.searchParams.has('id') ? profile : [profile],headers:{'content-range':'0-0/1'}});
   }
   if(url.pathname.endsWith('/auth/v1/user')) return route.fulfill({json:session.user});
   if(url.pathname.endsWith('/rpc/get_mvp_catalog_page')) return route.fulfill({json:{products:[],total:0,facets:{}}});
   return route.fulfill({json:[],headers:{'content-range':'0-0/0'}});
 });
}
for(const [role,type] of [['user','general_user'],['user','interior_designer'],['user','supplier_representative'],['reviewer','general_user']]) {
 test(`${role}/${type} is denied all six admin routes`,async({page})=>{
   await fixture(page,role,type);
   for(const route of ['dashboard','products','users','suppliers','categories','settings']) {
     await page.goto(`/admin/${route}`);
     await expect(page).toHaveURL('http://127.0.0.1:4173/');
   }
 });
}
for(const role of ['admin','super_admin']) {
 test(`${role} can reach all mounted admin pages`,async({page})=>{
   const crashes=[];page.on('pageerror',error=>crashes.push(error.message));
   await fixture(page,role);
   for(const route of ['dashboard','products','users','suppliers','categories','settings']) {
     await page.goto(`/admin/${route}`);
     await expect(page).toHaveURL(new RegExp(`/admin/${route}$`));
     await expect(page.locator('h1')).toBeVisible();
   }
   expect(crashes).toEqual([]);
 });
}
test('normal signed-in account cannot use the reset form',async({page})=>{
 await fixture(page);
 let writes=0;
 await page.route('**/auth/v1/user',route=>{if(route.request().method()==='PUT')writes++;return route.fallback();});
 await page.goto('/reset-password');
 await expect(page.getByRole('heading',{name:'Reset link unavailable'})).toBeVisible();
 await expect(page.locator('#new-password')).toHaveCount(0);
 expect(writes).toBe(0);
});
test('admin atomic save sends one RPC and preserves draft after rejection',async({page})=>{
 await fixture(page,'admin');
 let calls=[];
 await page.route('**/rpc/admin_save_mvp_product_bundle',route=>{
   calls.push(route.request().postDataJSON());
   return route.fulfill({status:400,json:{message:'Invalid specification fixture'}});
 });
 await page.goto('/admin/products');
 await page.getByRole('button',{name:'Create block',exact:true}).click();
 await page.getByLabel('Product name (English)').fill('Synthetic draft');
 await page.getByLabel('اسم المنتج (العربية)').fill('مسودة اختبار');
 await page.getByRole('button',{name:'Save draft',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('Invalid specification fixture');
 expect(calls).toHaveLength(1);
 expect(calls[0].p_items).toEqual([]);
 await expect(page.getByLabel('Product name (English)')).toHaveValue('Synthetic draft');
 page.once('dialog',dialog=>dialog.dismiss());
 await page.getByRole('button',{name:'Close editor'}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 page.once('dialog',dialog=>dialog.accept());
 await page.getByRole('button',{name:'Close editor'}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('supplier publishing requires a slug',async({page})=>{
 await fixture(page,'admin');
 await page.goto('/admin/suppliers');
 await page.getByRole('button',{name:'Create Supplier Window',exact:true}).click();
 await page.getByLabel('Company name (English)').fill('Synthetic supplier');
 await page.getByLabel('اسم الشركة (العربية)').fill('مورد اختبار');
 await expect(page.getByRole('button',{name:'Publish',exact:true})).toBeDisabled();
 await page.getByLabel('Slug',{exact:true}).fill('synthetic-supplier');
 await expect(page.getByRole('button',{name:'Publish',exact:true})).toBeEnabled();
});
test('public routes and demo disclosure work in Arabic on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.route('https://*.supabase.co/**',route=>route.fulfill({json:route.request().url().endsWith('/rpc/get_mvp_catalog_page')?{products:[],total:0,facets:{}}:[]}));
 await page.addInitScript(()=>localStorage.setItem('buod_language','ar'));
 for(const route of ['/','/blocks','/suppliers','/projects','/compare','/login','/forgot-password','/reset-password','/terms','/privacy','/missing']) {
   await page.goto(route);await expect(page.locator('h1').first()).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 }
 await page.goto('/blocks/catalog-basalt-reception-counter');
 await expect(page.getByRole('note')).toBeVisible();
 await page.getByRole('button',{name:'عرض 3D تفاعلي',exact:true}).first().click();
 await expect(page.getByText('نموذج بُعد تجريبي',{exact:true})).toBeVisible();
 await page.screenshot({path:'test-results/launch-arabic-mobile.png',animations:'disabled'});
});

test('profile failures fail closed visibly and retry restores current permissions',async({page})=>{
 await fixture(page,'admin');
 let fail=true;
 await page.route('**/rest/v1/profiles*',route=>fail ? route.fulfill({status:503,json:{message:'fixture outage'}}) : route.fallback());
 await page.goto('/admin/settings');
 await expect(page.getByRole('alert')).toContainText('Account permissions could not be loaded');
 await expect(page).toHaveURL('http://127.0.0.1:4173/');
 fail=false;
 await page.getByRole('button',{name:'Retry profile / إعادة المحاولة'}).click();
 await expect(page.getByRole('alert')).toHaveCount(0);
 await page.goto('/admin/settings');
 await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
});

test('role downgrade on focus removes admin access',async({page})=>{
 await fixture(page,'admin');
 let role='admin';
 await page.route('**/rest/v1/profiles*',route=>route.fulfill({json:{id:owner,full_name:'Isolated User',role}}));
 await page.goto('/admin/settings');
 await expect(page.getByRole('heading',{name:'Settings',exact:true})).toBeVisible();
 role='user';
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(page).toHaveURL('http://127.0.0.1:4173/');
});

test('fresh recovery intent shows account identity and preserves actionable error',async({page})=>{
 await fixture(page);
 await page.addInitScript(({owner})=>sessionStorage.setItem('buod-password-recovery',JSON.stringify({userId:owner,sessionId:'synthetic-session',startedAt:Date.now()})),{owner});
 let writes=0;
 await page.route('**/auth/v1/user',route=>{
   if(route.request().method()!=='PUT') return route.fallback();
   writes++;return route.fulfill({status:422,headers:{'x-supabase-api-version':'2024-01-01','access-control-expose-headers':'x-supabase-api-version'},json:{code:'same_password',msg:'New password should be different'}});
 });
 await page.goto('/reset-password');
 await expect(page.getByText('isolated@example.invalid',{exact:true})).toBeVisible();
 await page.locator('#new-password').fill('Synthetic-new-pass-only');
 await page.locator('#confirm-password').fill('Synthetic-new-pass-only');
 await page.getByRole('button',{name:'Update password',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('different from your current password');
 expect(writes).toBe(1);
});

test('older admin search responses cannot replace the newest result',async({page})=>{
 await fixture(page,'admin');
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 let oldStarted=false;
 await page.route('**/rest/v1/products*',async route=>{
   const query=new URL(route.request().url()).searchParams.get('or')||'';
   if(query.includes('old')) { oldStarted=true; await gate; }
   const name=query.includes('new')?'Newest result':'Old result';
   return route.fulfill({json:[{id:'fixture-product',product_name_en:name,product_name_ar:'اختبار',publication_state:'draft'}],headers:{'content-range':'0-0/1'}});
 });
 await page.goto('/admin/products');
 await page.getByRole('textbox',{name:'Search blocks'}).fill('old');
 await expect.poll(()=>oldStarted).toBe(true);
 await page.getByRole('textbox',{name:'Search blocks'}).fill('new');
 await expect(page.getByText('Newest result',{exact:true})).toBeVisible();
 release();
 await expect(page.getByText('Old result',{exact:true})).toHaveCount(0);
});

test('recovery callback survives reload and cannot follow an account switch',async({page})=>{
 await fixture(page);
 const token=btoa(JSON.stringify({alg:'HS256',typ:'JWT'}))+'.'+btoa(JSON.stringify({sub:owner,role:'authenticated',aud:'authenticated',session_id:'recovery-callback-fixture',exp:4102444800,iat:Math.floor(Date.now()/1000)}))+'.ZmFrZQ';
 await page.goto(`/reset-password#access_token=${token}&refresh_token=synthetic-refresh&expires_in=3600&token_type=bearer&type=recovery`);
 await expect(page.getByRole('heading',{name:'Choose a new password'})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('heading',{name:'Choose a new password'})).toBeVisible();
 await page.evaluate(({session})=>{
   localStorage.setItem('sb-workspace-fixture-auth-token',JSON.stringify({...session,user:{...session.user,id:'another-synthetic-user'}}));
 },{session});
 await page.reload();
 await expect(page.getByRole('heading',{name:'Reset link unavailable'})).toBeVisible();
});

test('browser back cannot discard an unsaved admin draft without confirmation',async({page})=>{
 await fixture(page,'admin');
 await page.goto('/admin/dashboard');
 await page.getByRole('link',{name:'Blocks',exact:true}).first().click();
 await page.getByRole('button',{name:'Create block',exact:true}).click();
 await page.getByLabel('Product name (English)').fill('Keep on back');
 page.once('dialog',dialog=>dialog.dismiss());
 await page.goBack();
 await expect(page.getByLabel('Product name (English)')).toHaveValue('Keep on back');
 await expect(page).toHaveURL(/\/admin\/products$/);
 page.once('dialog',dialog=>dialog.accept());
 await page.goBack();
 await expect(page).toHaveURL(/\/admin\/dashboard$/);
});

test('supplier details recover from request failure without a full reload',async({page})=>{
 await fixture(page);
 let fail=true;
 await page.route('**/rpc/get_mvp_supplier_window',route=>fail
   ? route.fulfill({status:503,json:{message:'fixture outage'}})
   : route.fulfill({json:{id:owner,slug:'synthetic-supplier',company_name_en:'Synthetic Supplier',company_name_ar:'مورد اختبار',is_published:true,verification_status:'unverified'}}));
 await page.goto('/suppliers/synthetic-supplier');
 await page.getByRole('button',{name:'Try again',exact:true}).click();
 await expect(page.getByRole('alert')).toBeVisible();
 fail=false;
 await page.getByRole('button',{name:'Try again',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Synthetic Supplier',exact:true})).toBeVisible();
});

test('malformed admin list responses show retry without exposing a runtime stack',async({page})=>{
 await fixture(page,'admin');
 let fail=true;
 await page.route('**/rest/v1/profiles*',route=>{
   const url=new URL(route.request().url());
   if(url.searchParams.has('id') || !fail) return route.fallback();
   return route.fulfill({json:{unexpected:true}});
 });
 await page.goto('/admin/users');
 await expect(page.getByText('Unexpected administrative list response. Retry the request.',{exact:true})).toBeVisible();
 await expect(page.getByText('Unexpected Application Error!',{exact:true})).toHaveCount(0);
 fail=false;
 await page.getByRole('button',{name:/Retry|Try again/}).click();
 await expect(page.getByText('Isolated User',{exact:true}).last()).toBeVisible();
});

test('missing profile fails closed and offers recovery',async({page})=>{
 await fixture(page,'admin');
 await page.route('**/rest/v1/profiles*',route=>route.fulfill({json:null}));
 await page.goto('/admin/settings');
 await expect(page.getByRole('alert')).toContainText('Account permissions could not be loaded');
 await expect(page.getByRole('button',{name:'Retry profile / إعادة المحاولة'})).toBeVisible();
 await expect(page).toHaveURL('http://127.0.0.1:4173/');
});

test('logout outage clears this device and explains unconfirmed remote revocation',async({page})=>{
 await fixture(page,'admin');
 await page.route('**/auth/v1/logout*',route=>route.fulfill({status:503,json:{message:'synthetic outage'}}));
 await page.goto('/admin/settings');
 await page.getByRole('button',{name:'Sign Out',exact:true}).first().click();
 await expect(page.getByRole('alert')).toContainText('Signed out on this device. Other sessions could not be revoked');
 await expect(page).toHaveURL('http://127.0.0.1:4173/login');
 await expect.poll(()=>page.evaluate(()=>localStorage.getItem('sb-workspace-fixture-auth-token'))).toBeNull();
});

test('reset verifies displayed identity and never writes after an account mismatch',async({page})=>{
 await fixture(page);
 await page.addInitScript(({owner})=>sessionStorage.setItem('buod-password-recovery',JSON.stringify({userId:owner,sessionId:'synthetic-session',startedAt:Date.now()})),{owner});
 let writes=0;
 await page.route('**/auth/v1/user',route=>{
   if(route.request().method()==='PUT') writes++;
   return route.fulfill({json:{...session.user,id:'different-account'}});
 });
 await page.goto('/reset-password');
 await page.locator('#new-password').fill('Synthetic-new-pass-only');
 await page.locator('#confirm-password').fill('Synthetic-new-pass-only');
 await page.getByRole('button',{name:'Update password',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Reset link unavailable'})).toBeVisible();
 expect(writes).toBe(0);
});

test('reset update pins authorization to the verified recovery token',async({page})=>{
 await fixture(page);
 await page.addInitScript(({owner})=>sessionStorage.setItem('buod-password-recovery',JSON.stringify({userId:owner,sessionId:'synthetic-session',startedAt:Date.now()})),{owner});
 let token;
 await page.route('**/auth/v1/user',async route=>{
   if(route.request().method()!=='PUT') return route.fallback();
   token=route.request().headers().authorization;
   // Simulate a different account appearing while the response is in flight.
   await page.evaluate(({session})=>localStorage.setItem('sb-workspace-fixture-auth-token',JSON.stringify({...session,user:{...session.user,id:'another-synthetic-account'}})),{session});
   return route.fulfill({json:session.user});
 });
 await page.goto('/reset-password');
 await page.locator('#new-password').fill('Synthetic-new-pass-only');
 await page.locator('#confirm-password').fill('Synthetic-new-pass-only');
 await page.getByRole('button',{name:'Update password',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Password updated'})).toBeVisible();
 expect(token).toBe(`Bearer ${session.access_token}`);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('sb-workspace-fixture-auth-token')).user.id)).toBe('another-synthetic-account');
});

test('unlicensed catalog files do not offer a signing request',async({page})=>{
 await fixture(page);
 const product={id:'33333333-3333-4333-8333-333333333333',slug:'licensed-fixture',product_name_en:'Licence fixture',product_name_ar:'اختبار',rights_confirmed:true,license_download:false};
 let signing=0;
 await page.route('**/rpc/get_mvp_product',route=>route.fulfill({json:product}));
 await page.route('**/rest/v1/products*',route=>route.fulfill({json:product}));
 await page.route('**/rest/v1/product_files*',route=>route.fulfill({json:[{id:owner,product_id:product.id,file_type:'block',file_format:'IFC',is_available:true}]}));
 await page.route('**/storage/v1/**',route=>{signing++;return route.fulfill({status:403,json:{message:'denied'}});});
 await page.goto('/blocks/licensed-fixture');
 await expect(page.getByRole('button',{name:'Download not permitted',exact:true})).toBeDisabled();
 expect(signing).toBe(0);
});

test('product upload blocks save and closing until registration and refresh finish',async({page})=>{
 await fixture(page,'admin');
 const product={id:'33333333-3333-4333-8333-333333333333',product_name_en:'Asset fixture',product_name_ar:'اختبار',publication_state:'draft'};
 await page.route('**/rest/v1/products*',route=>route.fulfill({json:new URL(route.request().url()).searchParams.has('id')?product:[product],headers:{'content-range':'0-0/1'}}));
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 let uploading=false;
 await page.route('**/storage/v1/object/product-images/**',async route=>{
   uploading=true;await gate;return route.fulfill({json:{Key:'synthetic-image'}});
 });
 await page.route('**/rpc/admin_register_mvp_product_image',route=>route.fulfill({json:{id:owner}}));
 await page.goto('/admin/products');
 await page.getByRole('button',{name:'Edit',exact:true}).click();
 await page.getByLabel('Choose a product image, up to 20 MB').setInputFiles({name:'synthetic.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aGtkAAAAASUVORK5CYII=','base64')});
 await page.getByRole('button',{name:'Upload image',exact:true}).click();
 await expect.poll(()=>uploading).toBe(true);
 await expect(page.getByRole('button',{name:'Save draft',exact:true})).toBeDisabled();
 await page.getByRole('button',{name:'Close editor',exact:true}).click();
 await expect(page.getByRole('dialog')).toBeVisible();
 release();
 await expect(page.getByText('Image uploaded and registered.',{exact:true})).toBeVisible();
 await expect(page.getByRole('button',{name:'Save draft',exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Close editor',exact:true}).click();
 await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('licensed download retries signing failure and requests a fresh bounded URL',async({page})=>{
 await fixture(page);
 const product={id:'33333333-3333-4333-8333-333333333333',slug:'download-fixture',product_name_en:'Download fixture',product_name_ar:'اختبار',rights_confirmed:true,license_download:true};
 const file={id:owner,product_id:product.id,file_type:'block',file_format:'IFC',is_available:true,original_file_name:'synthetic.ifc',storage_bucket:'product-files',file_path:`${product.id}/synthetic.ifc`};
 await page.route('**/rpc/get_mvp_product',route=>route.fulfill({json:product}));
 await page.route('**/rest/v1/products*',route=>route.fulfill({json:product}));
 await page.route('**/rest/v1/product_files*',route=>route.fulfill({json:new URL(route.request().url()).searchParams.has('id')?file:[file]}));
 const signing=[];
 await page.route('**/storage/v1/object/sign/product-files/**',route=>{
   if(route.request().method()==='GET') return route.fulfill({body:'Synthetic IFC test bytes',contentType:'application/octet-stream',headers:{'content-disposition':'attachment; filename="synthetic.ifc"'}});
   signing.push(route.request().postDataJSON());
   return signing.length===1 ? route.fulfill({status:403,json:{message:'synthetic denied/expired session'}})
     : route.fulfill({json:{signedURL:`/object/sign/product-files/${file.file_path}?token=synthetic-${signing.length}`}});
 });
 await page.goto('/blocks/download-fixture');
 await page.getByRole('button',{name:'Download',exact:true}).click();
 await expect(page.getByRole('alert')).toContainText('This file is unavailable or your session has expired');
 const downloaded=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download',exact:true}).click();
 expect((await downloaded).suggestedFilename()).toBe('synthetic.ifc');
 expect(signing).toHaveLength(2);
 expect(signing.every(body=>body.expiresIn===300)).toBe(true);
});

for(const [role,assignedRole] of [['admin','Reviewer'],['super_admin','Admin']]) {
 test(`${role} role-change denial remains visible without changing the displayed role`,async({page})=>{
   await fixture(page,role);
   await page.route('**/rest/v1/profiles*',route=>{
     if(new URL(route.request().url()).searchParams.has('id')) return route.fallback();
     return route.fulfill({json:[{id:'33333333-3333-4333-8333-333333333333',full_name:'Synthetic target',role:'user',user_type:'general_user'}],headers:{'content-range':'0-0/1'}});
   });
   let mutations=0;
   await page.route('**/rpc/admin_set_user_role',route=>{mutations++;return route.fulfill({status:403,json:{message:'Permission denied'}});});
   await page.goto('/admin/users');
   const row=page.getByRole('row').filter({hasText:'Synthetic target'});
   await row.getByRole('button',{name:'User',exact:true}).click();
   await page.getByRole('menuitem',{name:assignedRole,exact:true}).click();
   await expect(row.getByText('Permission denied',{exact:true})).toBeVisible();
   await expect(row.getByRole('button',{name:'User',exact:true})).toBeEnabled();
   expect(mutations).toBe(1);
 });
}
