// Basic state
const state = {
  presenter: true,
  industry: 'CPG',
  role: 'Executive',
  gxp: false,
  threshold: 0.70,
  kpis: {},
  journal: [],
  audit: [],
  inbox: [],
  mesh: { nodes: [], edges: [], messages: [] }
};

// Data catalogs
const scenarios = [
  { id:'cpg_promo', name:'CPG — Promo Surge', industry:'CPG',
    kpis:{ OSA:'↑ +1.4 pts', Markdown:'↓ -$420k', Expedite:'↓ -$180k' },
    risk:[0.6,0.5,0.35,0.4,0.25],
    agents:['DemandPlanner','SupplyPlanner','MEIO','ATP','Exceptions'],
    journal:[
      '[INFO] DemandPlanner simulated uplift 18% (promo weeks 7–9)',
      '[INFO] MEIO recalculated safety stocks (service target 96%)',
      '[GUARDRAIL] Autonomy 0.70 ≤ Threshold 0.70 — proposal allowed',
      '[APPROVAL] Expedite plan requires approver if GxP=true',
      '[INFO] ATP recomputed CTP; commit reduced by 12%'
    ]
  },
  { id:'ls_cold', name:'Life Sciences — Cold Chain Deviation', industry:'LifeSciences',
    kpis:{ ReleaseHours:'↓ -18 hrs', Deviations:'↓ -22%', Excursions:'↓ -17%' },
    risk:[0.35,0.25,0.55,0.4,0.5],
    agents:['BatchRelease','Quality','SupplyPlanner','ATP','Exceptions'],
    journal:[
      '[INFO] Quality ingested excursion telemetry (GLP compliant)',
      '[GUARDRAIL] GxP=true forces human approval for release',
      '[BLOCK] Threshold 0.72 > 0.70 — commit blocked until approval',
      '[INFO] Release cycle time improved by 18 hours post‑approval'
    ]
  }
];

const modelRegistry = [
  { name:'Forecast', version:'1.3.2', status:'OK' },
  { name:'Supply', version:'2.0.1', status:'OK' },
  { name:'MEIO', version:'0.9.7', status:'WARN' },
  { name:'ATP', version:'1.2.0', status:'OK' }
];

const connectors = [
  'SAP S/4HANA','Oracle ERP','Blue Yonder','Kinaxis','o9 Solutions','Manhattan WMS',
  'Snowflake','Databricks','GCP BigQuery','Azure Synapse','ServiceNow','Salesforce'
];

const ascEntities = [
  { name:'Forecasts', status:'OK' },
  { name:'Inventory', status:'OK' },
  { name:'Orders', status:'WARN' },
  { name:'LeadTimes', status:'OK' },
  { name:'BOM', status:'OK' },
  { name:'ServiceLevels', status:'WARN' },
  { name:'Telemetry (Cold‑Chain)', status:'OK' },
  { name:'Procurement', status:'OK' },
  { name:'Capacity', status:'OK' },
  { name:'MDM/Items', status:'OK' },
  { name:'Locations', status:'OK' },
  { name:'Customers', status:'OK' }
];

const canonAgents = ['DemandPlanner','SupplyPlanner','MEIO','ATP','Exceptions'];
const extraAgents = [
  'BatchRelease','Quality','SupplierRisk','Logistics','NetworkDesign','S&OP',
  'Replenishment','Returns','Kitting','Maintenance','Procurement','Manufacturing',
  'Allocation','Claims','FreightAudit','Slotting','PickPack','Yard','COE','Finance',
  'Sustainability','CO2Estimator','Warranty','VMI','Vulnerability'
];

// New: Assets catalog with provenance and KPI impacts (mocked)
const assetsCatalog = [
  {
    id:'ls_lot',
    name:'LS — Lot Size & Safety Stock',
    domain:'Life Sciences',
    provenance:'Pfizer pilot',
    kpis:{ ReleaseHours:'↓ -18 hrs', Deviations:'↓ -22%', Excursions:'↓ -17%' },
    dependencies:['Forecast','Inventory','ServiceLevels'],
    dependenciesStatus:{ Forecast:'OK', Inventory:'OK', ServiceLevels:'WARN' },
    policies:['GxP Approval Required','Threshold >0.70 blocks commit'],
    readiness:0.92,
    version:'1.1',
    packs:['Life Sciences Pack'],
    runs:[
      {client:'Pfizer', kpiImpact:{ ReleaseHours:-18, Deviations:-22, Excursions:-17 }, date:'2025-01-10'},
      {client:'Top-10 LS Client', kpiImpact:{ ReleaseHours:-20, Deviations:-25, Excursions:-18 }, date:'2025-04-15'}
    ]
  },
  {
    id:'cpg_promo_agent',
    name:'CPG — Promo Surge & Safety Stock',
    domain:'CPG',
    provenance:'Retail pilot',
    kpis:{ OSA:'↑ +1.4 pts', Markdown:'↓ -$420k', Expedite:'↓ -$180k' },
    dependencies:['Forecast','Orders','Inventory'],
    dependenciesStatus:{ Forecast:'OK', Orders:'WARN', Inventory:'OK' },
    policies:['Threshold >0.70 blocks commit'],
    readiness:0.88,
    version:'1.0',
    packs:['CPG Pack'],
    runs:[
      {client:'Retailer A', kpiImpact:{ OSA:1.4, Markdown:-420, Expedite:-180 }, date:'2025-02-01'},
      {client:'Retailer B', kpiImpact:{ OSA:1.6, Markdown:-400, Expedite:-160 }, date:'2025-06-01'}
    ]
  },
  {
    id:'ls_batch_release',
    name:'LS — Batch Release Pacing',
    domain:'Life Sciences',
    provenance:'Pilot',
    kpis:{ ReleaseHours:'↓ -12 hrs', Deviations:'↓ -15%', Excursions:'↓ -10%' },
    dependencies:['Forecast','Orders','Telemetry (Cold‑Chain)'],
    dependenciesStatus:{ Forecast:'OK', Orders:'OK', 'Telemetry (Cold‑Chain)':'OK' },
    policies:['GxP Approval Required'],
    readiness:0.90,
    version:'0.9',
    packs:['Life Sciences Pack'],
    runs:[
      {client:'Pfizer', kpiImpact:{ ReleaseHours:-12, Deviations:-15, Excursions:-10 }, date:'2024-11-12'},
      {client:'Top-10 LS Client', kpiImpact:{ ReleaseHours:-14, Deviations:-18, Excursions:-12 }, date:'2025-03-20'}
    ]
  }
];

// Mock clients for mapping
const clients = [
  {name:'Top-10 LS Client', systems:['SAP S/4HANA','Manhattan WMS'], gxp:true, threshold:0.75},
  {name:'Retailer A', systems:['Oracle ERP','Kinaxis','Snowflake'], gxp:false, threshold:0.65},
  {name:'Retailer B', systems:['Oracle ERP','Blue Yonder','Snowflake'], gxp:false, threshold:0.68},
  {name:'Pfizer', systems:['SAP S/4HANA','Manhattan WMS'], gxp:true, threshold:0.72}
];

// Lifecycle steps (static)
const lifecycle = [
  {id:'develop', title:'Develop', desc:'Create agent & logic'},
  {id:'validate', title:'Validate', desc:'Test against data contracts & policies'},
  {id:'catalog', title:'Catalog', desc:'Publish asset to repository'},
  {id:'map', title:'Map', desc:'Map asset to client systems'},
  {id:'deploy', title:'Deploy', desc:'Export plan to AI‑Refinery'},
  {id:'measure', title:'Measure', desc:'Track KPIs & guardrails'},
  {id:'upstream', title:'Upstream', desc:'Upstream improvements & version bumps'}
];

// Extend state for selected asset/client and deployment
state.selectedAsset = null;
state.selectedClient = null;
state.deploymentPlan = null;

// Policy mini-DSL (read-only)
const policyDSL = `policy ReleaseAndCommit {
  when industry == "LifeSciences" and GxP == true {
    require approval(role: "Approver") for actions in ["Commit","Release"]
  }
  when autonomy_threshold > 0.70 {
    block action == "Commit" unless approval.granted
  }
  always {
    log policy_evaluation to audit
  }
}`;

// Utility selectors
const $ = (sel)=>document.querySelector(sel);
const $$ = (sel)=>Array.from(document.querySelectorAll(sel));

// Init
window.addEventListener('DOMContentLoaded', () => {
  bindNav();
  initControls();
  renderScenarioList();
  renderKnowledge();
  renderASCModel();
  renderConnectors();
  renderGallery();
  renderCatalog();
  renderLifecycle();
  renderMapping();
  renderDeployment();
  renderProvenance();
  setPresenter(true);
  logInfo('ASC‑OS loaded');
});

function bindNav(){
  $$('#nav button').forEach(btn=>{
    btn.addEventListener('click',()=>{
      $$('#nav button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const view = btn.dataset.view;
      $$('.view').forEach(v=>v.classList.remove('active'));
      const target = $('#view-'+view);
      if(target){ target.classList.add('active'); }
      // render dynamic views on navigation
      if(view==='catalog') renderCatalog();
      if(view==='lifecycle') renderLifecycle();
      if(view==='mapping') renderMapping();
      if(view==='deployment') renderDeployment();
      if(view==='provenance') renderProvenance();
    });
  });
  $('#presenterMode').addEventListener('change',(e)=>setPresenter(e.target.checked));
  $('#startGuided').addEventListener('click',startGuided);
}

function initControls(){
  $('#industry').addEventListener('change', e => state.industry = e.target.value);
  $('#role').addEventListener('change', e => state.role = e.target.value);
  $('#gxp').addEventListener('change', e => state.gxp = e.target.checked);
  $('#threshold').addEventListener('input', e => {
    state.threshold = parseFloat(e.target.value);
    $('#thresholdVal').textContent = state.threshold.toFixed(2);
  });
  $('#runScenario').addEventListener('click', runScenario);
  // seed readiness
  renderReadiness();
}

function setPresenter(on){
  state.presenter = on;
  $('#presenterMode').checked = on;
  // In presenter mode, default to Canvas and hide builder-heavy views from nav
  const hide = ['timeline'];
  $$('#nav button').forEach(b=>{
    const v = b.dataset.view;
    const shouldHide = on && hide.includes(v);
    b.style.display = shouldHide ? 'none':'block';
  });
  // Ensure Canvas visible
  $$('#nav button').forEach(b=>b.classList.remove('active'));
  document.querySelector('button[data-view="canvas"]').classList.add('active');
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#view-canvas').classList.add('active');
}

function startGuided(){
  // Programmatic path for presenters
  // Guided path includes catalog → mapping → deployment → value → mesh → governance → ascmodel → connectors → provenance
  const steps = ['catalog','mapping','deployment','control','value','mesh','governance','ascmodel','connectors','provenance'];
  let i=0;
  const next = () => {
    if(i===0){ runScenario(); }
    if(i>=steps.length) return;
    const target = steps[i++];
    setTimeout(()=>{
      $$('#nav button').forEach(b=>b.classList.remove('active'));
      document.querySelector(`button[data-view="${target}"]`).classList.add('active');
      $$('.view').forEach(v=>v.classList.remove('active'));
      $('#view-'+target).classList.add('active');
      if(i<steps.length) next();
    }, 700);
  };
  next();
}

function renderScenarioList(){
  const el = $('#scenarioList'); el.innerHTML='';
  scenarios.forEach(s=>{
    const div = document.createElement('div');
    div.className = 'kpi';
    div.innerHTML = `<div style="font-weight:700">${s.name}</div>
      <div class="muted">${s.industry}</div>`;
    div.addEventListener('click', ()=>runScenario(s.id));
    el.appendChild(div);
  });
}

function renderKnowledge(){
  $('#policySnippet').textContent = policyDSL;
  const list = $('#modelRegistry'); list.innerHTML='';
  modelRegistry.forEach(m=>{
    const div = document.createElement('div');
    div.className='kpi';
    div.innerHTML = `<div>${m.name} <span class="muted">v${m.version}</span></div>
      <div class="badge ${badgeClass(m.status)}">${m.status}</div>`;
    list.appendChild(div);
  });
  const guards = $('#guardrails'); guards.innerHTML='';
  guards.append(...[
    li('Approval required when GxP=true for Commit/Release'),
    li('Block autonomous Commit when threshold > 0.70 without approval'),
    li('Log all policy evaluations to Audit')
  ]);
  function li(t){ const x=document.createElement('li'); x.textContent=t; x.className='kpi'; return x;}
  const appr = $('#approvalRules'); appr.innerHTML='';
  appr.appendChild(li('Approver: role=Approver; SLA: 4 business hours'));
}

function renderASCModel(){
  const el = $('#ascModel'); el.innerHTML='';
  ascEntities.forEach(e=>{
    const div = document.createElement('div'); div.className='entity';
    div.innerHTML = `<div class="title">${e.name}</div>
      <div class="badge ${badgeClass(e.status)}">${e.status}</div>`;
    el.appendChild(div);
  });
}

function renderConnectors(){
  const el = $('#connectors'); el.innerHTML='';
  connectors.forEach(c=>{
    const d = document.createElement('div'); d.className='logo'; d.textContent = c + '  •  Mock';
    el.appendChild(d);
  });
}

function renderGallery(){
  const el = $('#agentGallery'); el.innerHTML='';
  canonAgents.forEach(a=>{
    el.appendChild(agentTile(a,'Active'));
  });
  // add 24 extras greyed out
  extraAgents.forEach(a=>{
    el.appendChild(agentTile(a,'Coming soon', true));
  });
  function agentTile(name, status, disabled=false){
    const d = document.createElement('div'); d.className = 'agent' + (disabled?' disabled':'');
    d.innerHTML = `<div class="name">${name}</div><div class="status">${status}</div>`;
    return d;
  }
}

function badgeClass(status){
  if(status==='OK') return 'ok';
  if(status==='WARN') return 'warn';
  return 'block';
}

function renderReadiness(){
  // naive mock: derive from entities + models
  const oks = ascEntities.filter(e=>e.status==='OK').length + modelRegistry.filter(m=>m.status==='OK').length;
  const total = ascEntities.length + modelRegistry.length;
  const pct = Math.round((oks/total)*100);
  $('#readinessSummary').textContent = `Readiness Coverage: ${pct}%`;
  const pills = $('#missingPills'); pills.innerHTML='';
  if(pct<95){
    ['Agents','Data','Governance'].forEach(x=>{
      const sp = document.createElement('span'); sp.className='pill'; sp.textContent = `Missing: ${x}`; pills.appendChild(sp);
    });
  }
  // heatmap
  const hm = $('#heatmap'); hm.innerHTML='';
  for(let i=0;i<18;i++){
    const d=document.createElement('div'); d.className='heat ' + (Math.random()>0.76?'fail':(Math.random()>0.5?'warn':'ok'));
    hm.appendChild(d);
  }
}

function runScenario(id){
  const s = scenarios.find(x=>x.id===id) || scenarios.find(x=>x.industry===state.industry) || scenarios[0];
  state.journal = []; state.mesh = {nodes:[],edges:[],messages:[]};
  logInfo(`Running: ${s.name}`);

  // Construct mesh
  const agents = s.agents;
  state.mesh.nodes = agents.map((a,i)=>({id:a,x:80+ i*(560/(agents.length-1)), y: 90+ (i%2)*120}));
  // simulate messages
  const msg = (from,to,type,note,policy=null)=>{
    const m = {from,to,type,note,policy};
    state.mesh.messages.push(m);
    state.mesh.edges.push({from,to,policy});
  };

  // Policy evaluation
  const blocked = (state.gxp && (['Commit','Release'].includes('Commit'))) || (state.threshold>0.70);
  msg('DemandPlanner','SupplyPlanner','notify','Promo uplift/Deviation notice');
  msg('SupplyPlanner','MEIO','propose','Recompute inventory targets',{guard: state.threshold>0.70?'warn':'ok'});
  if(state.gxp){
    journal('GUARDRAIL','GxP=true forces approval for Commit/Release');
  }
  if(state.threshold>0.70){
    journal('GUARDRAIL',`Threshold ${state.threshold.toFixed(2)} > 0.70 — autonomous Commit blocked without approval`);
  }
  if(blocked){
    msg('MEIO','ATP','commit','Commit request',{guard:'block'});
    journal('BLOCK','Commit blocked — approval required');
    state.inbox.push({id:Date.now(), title:'Approve Commit', details:`Scenario ${s.name} requires approval`, status:'Pending'});
  }else{
    msg('MEIO','ATP','commit','Autonomous commit',{guard:'ok'});
    journal('INFO','Commit executed autonomously');
  }

  // KPIs
  state.kpis = s.kpis;
  $('#kpis').innerHTML = '';
  Object.entries(s.kpis).forEach(([k,v])=>{
    const d=document.createElement('div'); d.className='kpi'; d.innerHTML=`<div>${k}</div><div class="val">${v}</div>`; $('#kpis').appendChild(d);
  });

  // Risk dial
  $('#riskDial').textContent = state.industry==='CPG' ? 'Medium' : 'Medium‑Low';
  $('#kpiPreview').innerHTML = Object.entries(s.kpis).map(([k,v])=>`<div class="kpi"><div>${k}</div><div class="val">${v}</div></div>`).join('');

  // Radar
  drawRadar(s.risk);

  // Journal
  $('#journal').innerHTML=''; s.journal.forEach(line=>{
    const tag = line.startsWith('[BLOCK]')?'block':(line.startsWith('[GUARDRAIL]')?'guard':'info');
    addJournal(tag, line.replace(/^\[\w+\]\s*/,''));
  });
  // add runtime guard lines
  // Inbox render
  renderInbox();

  // Mesh render
  renderMesh();

  // So‑What banner
  const so = Object.entries(s.kpis).map(([k,v])=>`${k}: ${v}`).join(' • ');
  $('#soWhatBanner').textContent = `So‑What: ${so}`;

  // Move to Value
  $$('#nav button').forEach(b=>b.classList.remove('active'));
  document.querySelector('button[data-view="value"]').classList.add('active');
  $$('.view').forEach(v=>v.classList.remove('active'));
  $('#view-value').classList.add('active');

  // Audit
  state.audit.push({ts:new Date().toISOString(), scenario:s.id, gxp:state.gxp, threshold:state.threshold, result:so});
  renderAudit();
}

function addJournal(tag, text){
  const div = document.createElement('div');
  div.className = 'line';
  div.innerHTML = `<span class="tag ${tag}">${tag.toUpperCase()}</span> ${text}`;
  $('#journal').appendChild(div);
}

function journal(tag, text){
  addJournal(tag.toLowerCase(), text);
}

function logInfo(msg){
  state.audit.push({ts:new Date().toISOString(), msg});
}

function drawRadar(vals){
  // simple polygon
  const ctx = $('#radar').getContext('2d');
  ctx.clearRect(0,0,320,220);
  const cx=160, cy=110, r=80, n=vals.length;
  ctx.beginPath();
  vals.forEach((v,i)=>{
    const ang = (-Math.PI/2)+(i*2*Math.PI/n);
    const rad = r*(0.3+0.7*v);
    const x = cx + rad*Math.cos(ang);
    const y = cy + rad*Math.sin(ang);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.lineWidth=2; ctx.strokeStyle = '#7aa2f7'; ctx.stroke();
  ctx.globalAlpha=.12; ctx.fillStyle='#7aa2f7'; ctx.fill(); ctx.globalAlpha=1;
}

function renderMesh(){
  const svg = $('#meshGraph'); while(svg.firstChild) svg.removeChild(svg.firstChild);
  // nodes
  state.mesh.nodes.forEach(n=>{
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('cx', n.x); circle.setAttribute('cy', n.y); circle.setAttribute('r', 22);
    circle.setAttribute('fill', '#121826'); circle.setAttribute('stroke', '#2a3146'); circle.setAttribute('stroke-width', '2');
    svg.appendChild(circle);
    const text = document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x', n.x); text.setAttribute('y', n.y+4);
    text.setAttribute('text-anchor','middle'); text.setAttribute('fill','#c7d2ff');
    text.textContent = n.id.replace(/([A-Z])/g,' $1').trim();
    svg.appendChild(text);
  });
  // edges/messages
  const table = $('#meshTable'); table.innerHTML = '<tr><th>From</th><th>To</th><th>Type</th><th>Note</th><th>Policy</th></tr>';
  state.mesh.messages.forEach(m=>{
    const a = state.mesh.nodes.find(n=>n.id===m.from);
    const b = state.mesh.nodes.find(n=>n.id===m.to);
    if(!a || !b) return;
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1',a.x); line.setAttribute('y1',a.y);
    line.setAttribute('x2',b.x); line.setAttribute('y2',b.y);
    line.setAttribute('stroke', m.policy?.guard==='block' ? '#ef476f' : (m.policy?.guard==='warn'?'#ffd166':'#46d27a'));
    line.setAttribute('stroke-width','2');
    svg.appendChild(line);
    // shield
    const shield = document.createElementNS('http://www.w3.org/2000/svg','text');
    shield.setAttribute('x', (a.x+b.x)/2); shield.setAttribute('y',(a.y+b.y)/2 - 8);
    shield.setAttribute('text-anchor','middle'); shield.setAttribute('fill', m.policy?.guard==='block' ? '#ef476f' : (m.policy?.guard==='warn'?'#ffd166':'#46d27a'));
    shield.textContent = m.policy?.guard==='block' ? '✖' : (m.policy?.guard==='warn'?'⚠':'✓');
    svg.appendChild(shield);

    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${m.from}</td><td>${m.to}</td><td>${m.type}</td><td>${m.note}</td><td>${m.policy?m.policy.guard.toUpperCase():'—'}</td>`;
    if(m.policy?.guard==='block') tr.classList.add('strike');
    table.appendChild(tr);
  });
}

function renderInbox(){
  const el = $('#inbox'); el.innerHTML='';
  if(state.inbox.length===0){ el.innerHTML='<div class="muted">No approvals pending.</div>'; return; }
  state.inbox.forEach(item=>{
    const div = document.createElement('div'); div.className='item';
    div.innerHTML = `<div><strong>${item.title}</strong> — ${item.details}</div>
      <div class="muted">${item.status}</div>
      <div style="margin-top:6px"><button class="primary" data-id="${item.id}">Approve</button></div>`;
    el.appendChild(div);
  });
  el.querySelectorAll('button.primary').forEach(b=>b.addEventListener('click', (e)=>{
    const id = Number(e.target.dataset.id);
    const it = state.inbox.find(i=>i.id===id); if(it){ it.status='Approved'; }
    journal('INFO','Approval granted — re‑running commit');
    // un-block a blocked edge visually
    state.mesh.messages.forEach(m=>{ if(m.policy?.guard==='block') m.policy.guard='ok'; });
    renderMesh();
    renderInbox();
  }));
}

function renderAudit(){
  const el = $('#auditLog'); el.innerHTML='';
  state.audit.slice(-200).forEach(a=>{
    const d=document.createElement('div'); d.className='line';
    d.textContent = `${a.ts} — ${a.msg || `scenario=${a.scenario} gxp=${a.gxp} thr=${a.threshold} :: ${a.result}`}`;
    el.appendChild(d);
  });
}

// Export pack
$('#exportPack').addEventListener('click', ()=>{
  const pack = {
    name: 'ascos-refinery-pack',
    version: '0.1.0',
    exported: new Date().toISOString(),
    models: modelRegistry,
    policies: policyDSL,
    connectors,
    agents: canonAgents
  };
  const blob = new Blob([JSON.stringify(pack,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'ascos-refinery-pack.json'; a.click();
  $('#exportStatus').textContent = 'Exported ascos-refinery-pack.json';
});

// Render assets catalog
function renderCatalog(){
  const container = $('#assetCatalog');
  if(!container) return;
  container.innerHTML='';
  assetsCatalog.forEach(asset=>{
    const card = document.createElement('div');
    card.className = 'asset-card';
    // Compute short policies badges: use first word (e.g., GxP, Threshold)
    const badges = asset.policies.map(p => {
      const key = p.split(' ')[0];
      const cls = key.toLowerCase().includes('gxp') ? 'warn' : (key.toLowerCase().includes('threshold') ? 'block' : 'ok');
      return `<span class="badge ${cls}">${key}</span>`;
    }).join(' ');
    card.innerHTML = `<div class="title">${asset.name}</div>
      <div class="meta">${asset.domain} • v${asset.version}</div>
      <div class="meta muted">${asset.provenance}</div>
      <div class="kpi-list">${Object.entries(asset.kpis).map(([k,v])=>`<span>${k}: ${v}</span>`).join('')}</div>
      <div class="badge-container">${badges}</div>
      <div class="actions">
        <button class="primary preview" data-id="${asset.id}">Preview</button>
        <button class="primary map" data-id="${asset.id}">Map</button>
      </div>`;
    container.appendChild(card);
  });
  // Attach listeners for preview & map
  container.querySelectorAll('button.preview').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = e.target.dataset.id;
      const asset = assetsCatalog.find(a=>a.id===id);
      if(!asset) return;
      alert(`Previewing ${asset.name}\n\nKPIs:\n${Object.entries(asset.kpis).map(([k,v])=>`${k}: ${v}`).join('\n')}`);
    });
  });
  container.querySelectorAll('button.map').forEach(b=>{
    b.addEventListener('click', e=>{
      const id = e.target.dataset.id;
      state.selectedAsset = id;
      // Update lifecycle stepper after selecting asset
      renderLifecycle();
      // Navigate to mapping view
      document.querySelector('button[data-view="mapping"]').click();
    });
  });
}

// Render lifecycle stepper
function renderLifecycle(){
  const el = $('#lifecycleStepper');
  if(!el) return;
  el.innerHTML='';
  lifecycle.forEach((step, idx)=>{
    const div = document.createElement('div');
    div.className = 'step';
    // Determine active based on simple heuristics
    let active = false;
    if(step.id==='develop') active = true;
    if(step.id==='validate' && state.selectedAsset) active = true;
    if(step.id==='catalog' && state.selectedAsset) active = true;
    if(step.id==='map' && state.selectedAsset && state.selectedClient) active = true;
    if(step.id==='deploy' && state.deploymentPlan) active = true;
    if(step.id==='measure' && state.deploymentPlan) active = true;
    if(step.id==='upstream' && state.deploymentPlan) active = true;
    if(active) div.classList.add('active');
    div.innerHTML = `<div class="num">${idx+1}</div><div class="label">${step.title}</div>`;
    el.appendChild(div);
  });
}

// Render mapping wizard
function renderMapping(){
  const el = $('#mappingWizard');
  if(!el) return;
  el.innerHTML='';
  if(!state.selectedAsset){
    el.innerHTML = '<div class="muted">Select an asset from the Catalog to start mapping.</div>';
    return;
  }
  const asset = assetsCatalog.find(a=>a.id===state.selectedAsset);
  if(!asset) return;
  // Step 1: Asset overview
  const step1 = document.createElement('div');
  step1.className = 'wizard-step';
  step1.innerHTML = `<h4>1. Asset Overview</h4><div><strong>${asset.name}</strong> — ${asset.domain}</div>
    <div class="muted">Provenance: ${asset.provenance}</div>
    <div style="margin-top:4px">Dependencies: ${asset.dependencies.join(', ')}</div>`;
  el.appendChild(step1);
  // Step 2: Choose Client
  const step2 = document.createElement('div'); step2.className='wizard-step';
  step2.innerHTML = '<h4>2. Select Client</h4>';
  const select = document.createElement('select');
  select.innerHTML = '<option value="">— Select —</option>' + clients.map(c=>`<option value="${c.name}" ${state.selectedClient===c.name?'selected':''}>${c.name}</option>`).join('');
  select.addEventListener('change', e=>{
    state.selectedClient = e.target.value || null;
    renderMapping();
    renderLifecycle();
  });
  step2.appendChild(select);
  el.appendChild(step2);
  // If client selected, show mapping summary
  if(state.selectedClient){
    const client = clients.find(c=>c.name===state.selectedClient);
    // Step 3: Map Entities & Connectors
    const step3 = document.createElement('div'); step3.className='wizard-step';
    step3.innerHTML = '<h4>3. Map Entities & Connectors</h4>';
    // Entities mapping display
    const mapDiv = document.createElement('div'); mapDiv.className='map-entities';
    asset.dependencies.forEach(dep=>{
      const badge = document.createElement('div'); badge.className='entity-map';
      badge.textContent = `${dep} → ${client.systems[0] || 'Connector'}`;
      mapDiv.appendChild(badge);
    });
    step3.appendChild(mapDiv);
    // Connectors display
    const conn = document.createElement('div'); conn.style.marginTop='6px'; conn.innerHTML = `<strong>Connectors:</strong> ${client.systems.join(', ')}  •  Mock`;
    step3.appendChild(conn);
    // Policies display
    const pol = document.createElement('div'); pol.style.marginTop='6px'; pol.innerHTML = `<strong>Policies:</strong> ${asset.policies.join('; ')}`;
    step3.appendChild(pol);
    el.appendChild(step3);
    // Step 4: Policy validation settings
    const step4 = document.createElement('div'); step4.className='wizard-step';
    step4.innerHTML = '<h4>4. Policy & Threshold</h4>';
    // GxP toggle and threshold slider; use client's default
    const gxpDiv = document.createElement('div'); gxpDiv.style.marginBottom='6px';
    const gxpLabel = document.createElement('label');
    const gxpInput = document.createElement('input'); gxpInput.type = 'checkbox'; gxpInput.checked = client.gxp;
    gxpInput.addEventListener('change', e=>{ client.gxp = e.target.checked; });
    gxpLabel.appendChild(gxpInput);
    gxpLabel.appendChild(document.createTextNode('  GxP mode'));
    gxpDiv.appendChild(gxpLabel);
    step4.appendChild(gxpDiv);
    const thrDiv = document.createElement('div'); thrDiv.innerHTML = `<label>Threshold: </label><input type="range" min="0" max="1" step="0.01" value="${client.threshold.toFixed(2)}" style="width:140px;"/> <span class="muted">${client.threshold.toFixed(2)}</span>`;
    const thrInput = thrDiv.querySelector('input'); const thrSpan = thrDiv.querySelector('span');
    thrInput.addEventListener('input', e=>{ client.threshold = parseFloat(e.target.value); thrSpan.textContent = client.threshold.toFixed(2); });
    step4.appendChild(thrDiv);
    el.appendChild(step4);
    // Step 5: Generate plan button
    const step5 = document.createElement('div'); step5.className='wizard-step';
    const btn = document.createElement('button'); btn.textContent = 'Generate Deployment Plan';
    btn.addEventListener('click', ()=>{
      // Build deployment plan
      state.deploymentPlan = {
        asset: asset,
        client: client,
        connectors: client.systems,
        policies: asset.policies,
        gxp: client.gxp,
        threshold: client.threshold
      };
      logInfo(`Generated deployment plan for asset ${asset.name} and client ${client.name}`);
      // Navigate to deployment view
      document.querySelector('button[data-view="deployment"]').click();
    });
    step5.appendChild(btn);
    el.appendChild(step5);
  }
}

// Render deployment plan
function renderDeployment(){
  const el = $('#deploymentPlan');
  if(!el) return;
  el.innerHTML='';
  if(!state.deploymentPlan){
    el.innerHTML = '<div class="muted">Generate a deployment plan via the Mapping wizard.</div>';
    return;
  }
  const plan = state.deploymentPlan;
  const asset = plan.asset; const client = plan.client;
  // Plan items
  const list = [
    {label:'Asset', value: asset.name},
    {label:'Client', value: client.name},
    {label:'Domain', value: asset.domain},
    {label:'Connectors', value: plan.connectors.join(', ') + '  •  Mock'},
    {label:'Policies', value: plan.policies.join('; ')},
    {label:'GxP', value: plan.gxp ? 'Enabled' : 'Disabled'},
    {label:'Threshold', value: plan.threshold.toFixed(2)},
    {label:'Runtime Target', value: 'AI Refinery / Trusted Agent Huddle'},
    {label:'SLO', value: 'Decision latency <2s; Cost < $0.05/decision'},
    {label:'Rollback', value:'Manual approval required; revert to previous version'},
    {label:'Observability', value:'Audit log, KPI deltas & guardrails logged'}
  ];
  list.forEach(item=>{
    const div = document.createElement('div'); div.className='plan-item';
    div.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
    el.appendChild(div);
  });
  const btn = document.createElement('button'); btn.textContent = 'Deploy to AI Refinery (Mock)';
  btn.addEventListener('click', ()=>{
    // Simulate deployment
    logInfo(`Deployment plan for ${asset.name} sent to AI Refinery (mock)`);
    const status = document.createElement('div'); status.className='status';
    status.textContent = 'Deployment plan exported. Awaiting runtime execution.';
    el.appendChild(status);
    // After deploy, mark measure & upstream steps active
    renderLifecycle();
  });
  el.appendChild(btn);
}

// Compute provenance scores for bar chart
function computeProvenanceScores(){
  return assetsCatalog.map(asset=>{
    // compute average absolute improvement across runs
    let totalScore = 0;
    asset.runs.forEach(run=>{
      const values = Object.values(run.kpiImpact);
      values.forEach(v=>{ totalScore += Math.abs(v); });
    });
    const avg = totalScore / asset.runs.length;
    return {id: asset.id, name: asset.name, avg: avg, color: asset.domain==='Life Sciences' ? '#7aa2f7' : (asset.domain==='CPG' ? '#ffd166' : '#ef476f')};
  });
}

// Draw provenance bar chart
function drawProvenance(){
  const canvas = document.getElementById('provenanceChart');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const data = computeProvenanceScores();
  if(data.length===0) return;
  const maxVal = Math.max(...data.map(d=>d.avg));
  const barWidth = canvas.width / (data.length*1.5);
  const gap = barWidth/2;
  data.forEach((d,i)=>{
    const x = i * (barWidth + gap) + gap/2;
    const barHeight = (d.avg / maxVal) * (canvas.height - 40);
    const y = canvas.height - barHeight - 20;
    ctx.fillStyle = d.color;
    ctx.fillRect(x,y,barWidth,barHeight);
    // label below
    ctx.fillStyle = '#cbd5ff';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.name.split(' — ')[0], x + barWidth/2, canvas.height - 6);
  });
  // y-axis ticks
  ctx.strokeStyle = '#2a3146';
  ctx.beginPath(); ctx.moveTo(0, canvas.height-20); ctx.lineTo(canvas.width, canvas.height-20); ctx.stroke();
}

// Render provenance view
function renderProvenance(){
  const chart = document.getElementById('provenanceChart');
  if(chart){ drawProvenance(); }
  const details = document.getElementById('provenanceDetails');
  if(!details) return;
  details.innerHTML='';
  assetsCatalog.forEach(asset=>{
    const div = document.createElement('div');
    div.innerHTML = `<strong>${asset.name}</strong> — Runs: ${asset.runs.length}`;
    asset.runs.forEach(run=>{
      const sub = document.createElement('div'); sub.style.marginLeft='12px';
      const kpiList = Object.entries(run.kpiImpact).map(([k,v])=>`${k}: ${v}`).join(', ');
      sub.textContent = `${run.client} (${run.date}): ${kpiList}`;
      div.appendChild(sub);
    });
    details.appendChild(div);
  });
}
