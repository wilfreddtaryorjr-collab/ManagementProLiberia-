/* ============================================================
   MPL Portal — shared data layer
   Uses window.storage (Claude artifact persistence) so that
   logins, check-ins, and maintenance updates actually persist
   between reloads and across the login/client/team pages.
   Falls back to in-memory data (no persistence) if opened
   somewhere window.storage isn't available, so the demo still
   works — it just won't remember anything after a refresh.
   ============================================================ */

const DB_KEYS = {
  users: 'mpl_users',
  properties: 'mpl_properties',
  maintenance: 'mpl_maintenance',
  checkins: 'mpl_checkins',
  financials: 'mpl_financials',
  reports: 'mpl_reports',
  seeded: 'mpl_seeded_v1'
};

const _memory = {}; // fallback store if window.storage is unavailable
const hasStorage = () => typeof window !== 'undefined' && !!window.storage;

async function dbGet(key, fallback, shared){
  if(!hasStorage()){
    return key in _memory ? _memory[key] : fallback;
  }
  try{
    const res = await window.storage.get(key, shared);
    return res ? JSON.parse(res.value) : fallback;
  } catch(e){
    return fallback;
  }
}

async function dbSet(key, value, shared){
  if(!hasStorage()){
    _memory[key] = value;
    return true;
  }
  try{
    const res = await window.storage.set(key, JSON.stringify(value), shared);
    return !!res;
  } catch(e){
    console.error('MPL storage write failed for', key, e);
    return false;
  }
}

async function dbDelete(key, shared){
  if(!hasStorage()){ delete _memory[key]; return true; }
  try{ await window.storage.delete(key, shared); return true; } catch(e){ return false; }
}

/* ---------------- Seed data (first run only) ---------------- */
async function ensureSeed(){
  const seeded = await dbGet(DB_KEYS.seeded, false, true);
  if(seeded) return;

  const users = [
    { email:'rebecca@client.mpl', password:'demo', role:'client', name:'Rebecca Johnson', phone:'+1 (404) 555-0148', location:'Georgia, US' },
    { email:'emmanuel@client.mpl', password:'demo', role:'client', name:'Emmanuel Doe', phone:'', location:'' },
    { email:'grace@client.mpl', password:'demo', role:'client', name:'Grace Wilson', phone:'', location:'' },
    { email:'patricia@client.mpl', password:'demo', role:'client', name:'Patricia Freeman', phone:'', location:'' },
    { email:'james@client.mpl', password:'demo', role:'client', name:'James Cooper', phone:'', location:'' },
    { email:'team@mpl.local', password:'demo', role:'team', name:'James Kollie', title:'Field Inspector' }
  ];

  const properties = [
    { id:'sinkor', name:'Sinkor Family Compound', clientEmail:'rebecca@client.mpl', type:'Residential compound', address:'Sinkor, Monrovia', lat:6.3156, lng:-10.8074, status:'verified', lastInspection:'2026-08-29' },
    { id:'ria', name:'RIA Road Duplex', clientEmail:'rebecca@client.mpl', type:'Rental duplex', address:'RIA Highway, Margibi County', lat:6.2400, lng:-10.3623, status:'verified', lastInspection:'2026-08-22' },
    { id:'oldroad', name:'Old Road Warehouse', clientEmail:'emmanuel@client.mpl', type:'Warehouse / construction', address:'Old Road, Monrovia', lat:6.3010, lng:-10.7980, status:'pending', lastInspection:'2026-08-18' },
    { id:'congotown', name:'Congo Town Land Parcel', clientEmail:'grace@client.mpl', type:'Vacant land', address:'Congo Town, Monrovia', lat:6.2650, lng:-10.7460, status:'verified', lastInspection:'2026-09-01' },
    { id:'paynesville', name:'Paynesville Duplex', clientEmail:'patricia@client.mpl', type:'Rental duplex', address:'Paynesville, Monrovia', lat:6.2830, lng:-10.6790, status:'verified', lastInspection:'2026-08-27' },
    { id:'broadst', name:'Broad Street Storefront', clientEmail:'james@client.mpl', type:'Commercial unit', address:'Broad Street, Monrovia', lat:6.3120, lng:-10.7980, status:'pending', lastInspection:'2026-08-14' }
  ];

  const maintenance = [
    { id:'m1', propertyId:'ria', title:'Unit B kitchen sink leak', description:'Tenant reported a slow leak under the sink. Plumber scheduled for repair.', status:'in_progress', date:'2026-08-30' },
    { id:'m2', propertyId:'sinkor', title:'Perimeter fence repair', description:'Storm damage to the rear fence line was repaired and reinforced.', status:'resolved', date:'2026-08-12' },
    { id:'m3', propertyId:'sinkor', title:'Repaint exterior', description:'Scheduled for the September dry-season window, pending approval on the estimate.', status:'awaiting_approval', date:'2026-09-15' }
  ];

  const checkins = [
    { id:'c1', propertyId:'sinkor', lat:6.3156, lng:-10.8074, time:'2026-08-29T08:14:00', teamMember:'J. Kollie', note:'Routine inspection & photo update' },
    { id:'c2', propertyId:'ria', lat:6.2400, lng:-10.3623, time:'2026-08-22T10:02:00', teamMember:'M. Toe', note:'Rent collection, tenant check-in' },
    { id:'c3', propertyId:'sinkor', lat:6.3155, lng:-10.8073, time:'2026-08-12T09:40:00', teamMember:'J. Kollie', note:'Fence repair follow-up' },
    { id:'c4', propertyId:'congotown', lat:6.2650, lng:-10.7460, time:'2026-09-01T08:41:00', teamMember:'J. Kollie', note:'Boundary monitoring' }
  ];

  const financials = [
    { id:'f1', propertyId:'ria', period:'2026-08', rentCollected:1450, fee:145, repairs:60, netRemitted:1245 }
  ];

  const reports = [
    { id:'r1', propertyId:'ria', period:'2026-08', type:'Financial & inspection summary' },
    { id:'r2', propertyId:'sinkor', period:'2026-08', type:'Inspection summary' },
    { id:'r3', propertyId:'ria', period:'2026-07', type:'Financial & inspection summary' },
    { id:'r4', propertyId:'sinkor', period:'2026-07', type:'Inspection summary' }
  ];

  await dbSet(DB_KEYS.users, users, true);
  await dbSet(DB_KEYS.properties, properties, true);
  await dbSet(DB_KEYS.maintenance, maintenance, true);
  await dbSet(DB_KEYS.checkins, checkins, true);
  await dbSet(DB_KEYS.financials, financials, true);
  await dbSet(DB_KEYS.reports, reports, true);
  await dbSet(DB_KEYS.seeded, true, true);
}

/* ---------------- Session (personal to this browser) ---------------- */
async function getSession(){ return dbGet('mpl_session', null, false); }
async function setSession(session){ return dbSet('mpl_session', session, false); }
async function clearSession(){ return dbDelete('mpl_session', false); }

/* ---------------- Auth ---------------- */
async function login(email, password){
  await ensureSeed();
  const users = await dbGet(DB_KEYS.users, [], true);
  const user = users.find(u => u.email.toLowerCase() === String(email).trim().toLowerCase());
  if(!user) return { ok:false, error:'no_user' };
  if(user.password !== password) return { ok:false, error:'bad_password' };
  await setSession({ email:user.email, role:user.role, name:user.name });
  return { ok:true, user };
}

async function signupClient({ name, email, password, phone }){
  await ensureSeed();
  const users = await dbGet(DB_KEYS.users, [], true);
  if(users.some(u => u.email.toLowerCase() === String(email).trim().toLowerCase())){
    return { ok:false, error:'exists' };
  }
  const user = { email: email.trim(), password, role:'client', name, phone: phone || '', location:'' };
  users.push(user);
  const saved = await dbSet(DB_KEYS.users, users, true);
  if(!saved) return { ok:false, error:'save_failed' };
  await setSession({ email:user.email, role:'client', name:user.name });
  return { ok:true, user };
}

async function requireSession(role){
  const session = await getSession();
  if(!session || (role && session.role !== role)){
    window.location.href = 'login.html';
    return null;
  }
  return session;
}

/* ---------------- Data access ---------------- */
async function getAllProperties(){ await ensureSeed(); return dbGet(DB_KEYS.properties, [], true); }
async function getClientProperties(email){
  const all = await getAllProperties();
  return all.filter(p => p.clientEmail.toLowerCase() === email.toLowerCase());
}
async function getMaintenanceFor(propertyIds){
  const all = await dbGet(DB_KEYS.maintenance, [], true);
  return all.filter(m => propertyIds.includes(m.propertyId));
}
async function getCheckinsFor(propertyIds){
  const all = await dbGet(DB_KEYS.checkins, [], true);
  return all.filter(c => propertyIds.includes(c.propertyId))
            .sort((a,b) => new Date(b.time) - new Date(a.time));
}
async function getFinancialsFor(propertyIds){
  const all = await dbGet(DB_KEYS.financials, [], true);
  return all.filter(f => propertyIds.includes(f.propertyId));
}
async function getReportsFor(propertyIds){
  const all = await dbGet(DB_KEYS.reports, [], true);
  return all.filter(r => propertyIds.includes(r.propertyId));
}
async function getUserByEmail(email){
  const users = await dbGet(DB_KEYS.users, [], true);
  return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
}

/* Team actions — these are the writes that make the check-in "real" */
async function recordCheckin({ propertyId, lat, lng, teamMember, note }){
  const checkins = await dbGet(DB_KEYS.checkins, [], true);
  const entry = {
    id: 'c' + Date.now(),
    propertyId, lat, lng,
    time: new Date().toISOString(),
    teamMember: teamMember || 'Field Team',
    note: note || 'Routine visit'
  };
  checkins.unshift(entry);
  await dbSet(DB_KEYS.checkins, checkins, true);

  const properties = await dbGet(DB_KEYS.properties, [], true);
  const idx = properties.findIndex(p => p.id === propertyId);
  if(idx > -1){
    properties[idx].status = 'verified';
    properties[idx].lastInspection = entry.time.slice(0,10);
    await dbSet(DB_KEYS.properties, properties, true);
  }
  return entry;
}

async function updateMaintenanceStatus(id, status){
  const items = await dbGet(DB_KEYS.maintenance, [], true);
  const idx = items.findIndex(m => m.id === id);
  if(idx > -1){
    items[idx].status = status;
    await dbSet(DB_KEYS.maintenance, items, true);
  }
  return items;
}
