import { supabase, configured } from './supabase.js';
import { loadRecords, saveRecord, deleteRecord } from './data.js';

const $ = (selector, root = document) => root.querySelector(selector);
const root = $('#view-root');
const dialog = $('#record-dialog');
const state = { view: 'dashboard', records: { tutores: [], animais: [], consultas: [] }, session: null, month: new Date().toISOString().slice(0, 7), search: '', species: '', status: '', periodFrom: '', periodTo: '', animalFilter: '', vetFilter: '' };
const today = new Date().toISOString().slice(0, 10);
const names = { tutores: 'Tutores', animais: 'Animais', consultas: 'Consultas' };
const schema = {
  tutores: [
    { key: 'nome_completo', label: 'Nome completo', required: true, wide: true }, { key: 'cpf', label: 'CPF', required: true }, { key: 'telefone', label: 'Telefone', required: true }, { key: 'email', label: 'E-mail', type: 'email' }, { key: 'endereco', label: 'Endereço', wide: true }
  ],
  animais: [
    { key: 'nome', label: 'Nome do animal', required: true }, { key: 'tutor_id', label: 'Tutor responsável', type: 'select', required: true, options: 'tutores' }, { key: 'especie', label: 'Espécie', type: 'select', required: true, options: ['cachorro','gato','ave','reptil','outros'], labels: ['Cachorro','Gato','Ave','Réptil','Outros'] }, { key: 'raca', label: 'Raça' }, { key: 'sexo', label: 'Sexo', type: 'select', options: ['macho','femea','desconhecido'], labels: ['Macho','Fêmea','Não informado'] }, { key: 'data_nascimento', label: 'Data de nascimento', type: 'date' }, { key: 'peso', label: 'Peso (kg)', type: 'number', step: '0.01', min: '0.01' }, { key: 'cor', label: 'Cor' }, { key: 'observacoes', label: 'Observações', type: 'textarea', wide: true }
  ],
  consultas: [
    { key: 'animal_id', label: 'Animal', type: 'select', required: true, options: 'animais' }, { key: 'veterinario', label: 'Veterinário', required: true }, { key: 'data_consulta', label: 'Data', type: 'date', required: true }, { key: 'horario', label: 'Horário', type: 'time', required: true }, { key: 'tipo', label: 'Tipo de atendimento', type: 'select', required: true, options: ['consulta de rotina','vacinação','emergência','retorno','exames','cirurgia'], labels: ['Consulta de rotina','Vacinação','Emergência','Retorno','Exames','Cirurgia'] }, { key: 'status', label: 'Status', type: 'select', required: true, options: ['agendada','em andamento','concluída','cancelada'], labels: ['Agendada','Em andamento','Concluída','Cancelada'] }, { key: 'sintomas', label: 'Sintomas', type: 'textarea', wide: true }, { key: 'diagnostico', label: 'Diagnóstico', type: 'textarea', wide: true }, { key: 'tratamento', label: 'Tratamento', type: 'textarea', wide: true }, { key: 'observacoes', label: 'Observações', type: 'textarea', wide: true }
  ]
};
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const flash = (icon, title, text = '') => Swal.fire({ icon, title, text, confirmButtonColor: '#1e3a8a', customClass: { popup: document.documentElement.classList.contains('dark') ? 'dark' : '' } });
const tutorName = (id) => state.records.tutores.find((row) => row.id === id)?.nome_completo || 'Tutor indisponível';
const animalName = (id) => state.records.animais.find((row) => row.id === id)?.nome || 'Animal indisponível';
const datePt = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR') : '—';
const setTheme = (dark) => { document.documentElement.classList.toggle('dark', dark); localStorage.setItem('vetcare-theme', dark ? 'dark' : 'light'); $('#theme-toggle').innerHTML = `<i data-lucide="${dark ? 'sun' : 'moon'}" aria-hidden="true"></i><span>${dark ? 'Tema claro' : 'Tema escuro'}</span>`; window.lucide?.createIcons(); };

function setView(view) {
  state.view = view; state.search = ''; state.species = ''; state.status = '';
  document.querySelectorAll('.nav-item[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  $('#page-title').textContent = view === 'dashboard' ? 'Dashboard' : names[view];
  render();
}
async function refresh() {
  root.innerHTML = '<p class="loading">Carregando dados…</p>';
  try { state.records = await loadRecords(); render(); }
  catch (error) { root.innerHTML = '<section class="empty-state"><p>Não foi possível carregar os dados. Confira a conexão, a sessão e as políticas RLS.</p></section>'; console.error(error); }
}
function metric(label, value, icon) { return `<article class="metric"><div class="metric-top"><span>${label}</span><span class="metric-icon"><i data-lucide="${icon}" aria-hidden="true"></i></span></div><strong>${value}</strong></article>`; }
function renderDashboard() {
  const { tutores, animais, consultas } = state.records;
  const monthRows = consultas.filter((row) => (row.data_consulta || '').startsWith(state.month));
  const scheduled = monthRows.filter((row) => row.status === 'agendada');
  const completed = monthRows.filter((row) => row.status === 'concluída');
  const todayCount = consultas.filter((row) => row.data_consulta === today).length;
  const upcoming = consultas.filter((row) => row.data_consulta >= today && row.status !== 'cancelada').sort((a,b) => `${a.data_consulta} ${a.horario}`.localeCompare(`${b.data_consulta} ${b.horario}`)).slice(0,5);
  const recent = [...animais].sort((a,b) => b.criado_em.localeCompare(a.criado_em)).slice(0,5);
  const types = [...new Set(monthRows.map((row) => row.tipo))];
  root.innerHTML = `<div class="toolbar"><label for="month-filter">Período dos indicadores</label><input id="month-filter" type="month" value="${state.month}"></div><p class="muted">Indicadores de consultas para ${new Date(`${state.month}-02`).toLocaleDateString('pt-BR',{month:'long',year:'numeric'})}.</p><section class="metrics">${metric('Tutores cadastrados',tutores.length,'users')}${metric('Animais cadastrados',animais.length,'heart')}${metric('Consultas agendadas',scheduled.length,'calendar-clock')}${metric('Consultas concluídas',completed.length,'clipboard-check')}${metric('Consultas de hoje',todayCount,'calendar-days')}</section><div class="dashboard-grid"><section class="panel"><h3>Próximas consultas</h3>${upcoming.length ? `<div class="table-card"><table class="data-table"><thead><tr><th>Animal / tutor</th><th>Veterinário</th><th>Data e horário</th><th>Status</th></tr></thead><tbody>${upcoming.map((row) => `<tr><td><b>${escapeHtml(animalName(row.animal_id))}</b><br><small>${escapeHtml(tutorName(state.records.animais.find((a)=>a.id===row.animal_id)?.tutor_id))}</small></td><td>${escapeHtml(row.veterinario)}</td><td>${datePt(row.data_consulta)} · ${escapeHtml(row.horario?.slice(0,5))}</td><td>${statusBadge(row.status)}</td></tr>`).join('')}</tbody></table></div>` : '<p class="empty">Nenhuma consulta futura cadastrada.</p>'}</section><section class="panel"><h3>Animais recentes</h3>${recent.length ? recent.map((row) => `<div class="list-row"><span class="metric-icon"><i data-lucide="heart" aria-hidden="true"></i></span><span><b>${escapeHtml(row.nome)}</b><small>${escapeHtml(tutorName(row.tutor_id))}</small></span><span class="badge">${escapeHtml(row.especie)}</span></div>`).join('') : '<p class="empty">Nenhum animal cadastrado.</p>'}</section><section class="panel"><h3>Atendimentos por tipo</h3>${types.length ? types.map((type) => `<div class="summary-row"><span>${escapeHtml(type)}</span><b>${monthRows.filter((row)=>row.tipo===type).length}</b></div>`).join('') : '<p class="empty">Sem atendimentos neste período.</p>'}</section><section class="panel"><h3>Atendimentos por status</h3>${['agendada','em andamento','concluída','cancelada'].map((status) => `<div class="summary-row"><span>${escapeHtml(status)}</span><b>${monthRows.filter((row)=>row.status===status).length}</b></div>`).join('')}</section></div>`;
  $('#month-filter').addEventListener('change',(event)=>{state.month=event.target.value || state.month;renderDashboard();});
  window.lucide?.createIcons();
}
function statusBadge(status) { return `<span class="badge status-${status === 'concluída' ? 'concluida' : status}">${escapeHtml(status || '—')}</span>`; }
function filteredRows(view) {
  const rows = [...state.records[view]];
  if (view === 'tutores') return rows.filter((row) => `${row.nome_completo} ${row.cpf} ${row.telefone}`.toLowerCase().includes(state.search.toLowerCase())).sort((a,b)=>b.criado_em.localeCompare(a.criado_em));
  if (view === 'animais') return rows.filter((row) => row.nome.toLowerCase().includes(state.search.toLowerCase()) && (!state.species || row.especie === state.species));
  return rows.filter((row) => `${animalName(row.animal_id)} ${row.veterinario}`.toLowerCase().includes(state.search.toLowerCase()) && (!state.status || row.status === state.status) && (!state.animalFilter || row.animal_id === state.animalFilter) && (!state.vetFilter || row.veterinario.toLowerCase().includes(state.vetFilter.toLowerCase())) && (!state.periodFrom || row.data_consulta >= state.periodFrom) && (!state.periodTo || row.data_consulta <= state.periodTo)).sort((a,b)=>`${a.data_consulta} ${a.horario}`.localeCompare(`${b.data_consulta} ${b.horario}`));
}
function tableConfig(view) {
  if (view === 'tutores') return { headers:['Tutor','Telefone','E-mail','Animais'], cells:(row)=>[escapeHtml(row.nome_completo),escapeHtml(row.telefone),escapeHtml(row.email || '—'),String(state.records.animais.filter((a)=>a.tutor_id===row.id).length)] };
  if (view === 'animais') return { headers:['Animal','Espécie','Raça','Tutor'], cells:(row)=>[escapeHtml(row.nome),escapeHtml(row.especie),escapeHtml(row.raca || '—'),escapeHtml(tutorName(row.tutor_id))] };
  return { headers:['Animal / tutor','Veterinário','Data e horário','Tipo','Status'], cells:(row)=>[`${escapeHtml(animalName(row.animal_id))}<br><small>${escapeHtml(tutorName(state.records.animais.find((a)=>a.id===row.animal_id)?.tutor_id))}</small>`,escapeHtml(row.veterinario),`${datePt(row.data_consulta)} · ${escapeHtml(row.horario?.slice(0,5))}`,escapeHtml(row.tipo),statusBadge(row.status)] };
}
function renderList(view) {
  const rows = filteredRows(view), cfg = tableConfig(view);
  const filter = view === 'animais' ? `<select id="species-filter" aria-label="Filtrar espécie"><option value="">Todas as espécies</option>${['cachorro','gato','ave','reptil','outros'].map((s)=>`<option value="${s}" ${state.species===s?'selected':''}>${s}</option>`).join('')}</select>` : view === 'consultas' ? `<select id="animal-filter" aria-label="Filtrar por animal"><option value="">Todos os animais</option>${state.records.animais.map((a)=>`<option value="${a.id}" ${state.animalFilter===a.id?'selected':''}>${escapeHtml(a.nome)}</option>`).join('')}</select><input id="vet-filter" placeholder="Veterinário" aria-label="Filtrar veterinário" value="${escapeHtml(state.vetFilter)}"><input id="period-from" type="date" aria-label="Data inicial" value="${state.periodFrom}"><input id="period-to" type="date" aria-label="Data final" value="${state.periodTo}"><select id="status-filter" aria-label="Filtrar status"><option value="">Todos os status</option>${['agendada','em andamento','concluída','cancelada'].map((s)=>`<option ${state.status===s?'selected':''}>${s}</option>`).join('')}</select>` : '';
  root.innerHTML = `<section class="view-heading"><div><h2>${names[view]}</h2><p>${view === 'consultas' ? 'Organize os atendimentos e acompanhe o histórico.' : `Gerencie os registros de ${view}.`}</p></div><button class="button primary" id="new-record"><i data-lucide="plus" aria-hidden="true"></i>Novo ${view === 'tutores' ? 'tutor' : view === 'animais' ? 'animal' : 'consulta'}</button></section><div class="toolbar"><input id="search-records" type="search" placeholder="${view==='tutores'?'Buscar por nome, CPF ou telefone':view==='animais'?'Buscar animal por nome':'Buscar por animal ou veterinário'}" value="${escapeHtml(state.search)}" aria-label="Pesquisar">${filter}</div>${rows.length ? `<div class="table-card"><table class="data-table"><thead><tr>${cfg.headers.map((h)=>`<th>${h}</th>`).join('')}<th>Ações</th></tr></thead><tbody>${rows.map((row)=>`<tr>${cfg.cells(row).map((cell)=>`<td>${cell}</td>`).join('')}<td><div class="row-actions"><button data-action="view" data-id="${row.id}" aria-label="Ver detalhes"><i data-lucide="eye" aria-hidden="true"></i></button><button data-action="edit" data-id="${row.id}" aria-label="Editar"><i data-lucide="pencil" aria-hidden="true"></i></button><button data-action="delete" data-id="${row.id}" aria-label="Excluir"><i data-lucide="trash-2" aria-hidden="true"></i></button></div></td></tr>`).join('')}</tbody></table></div>` : `<section class="empty-state"><i data-lucide="${view==='consultas'?'calendar-days':view==='animais'?'heart':'users'}" aria-hidden="true"></i><p>${state.search || state.species || state.status || state.animalFilter || state.vetFilter || state.periodFrom || state.periodTo ? 'Nenhum registro encontrado com esses filtros.' : `Nenhum registro de ${view} cadastrado ainda.`}</p></section>`}`;
  $('#new-record').addEventListener('click',()=>openForm(view));
  $('#search-records').addEventListener('input',(event)=>{state.search=event.target.value;renderList(view);$('#search-records').focus();$('#search-records').setSelectionRange(state.search.length,state.search.length);});
  $('#species-filter')?.addEventListener('change',(event)=>{state.species=event.target.value;renderList(view);});
  $('#status-filter')?.addEventListener('change',(event)=>{state.status=event.target.value;renderList(view);});
  $('#animal-filter')?.addEventListener('change',(event)=>{state.animalFilter=event.target.value;renderList(view);});
  $('#vet-filter')?.addEventListener('input',(event)=>{state.vetFilter=event.target.value;renderList(view);});
  $('#period-from')?.addEventListener('change',(event)=>{state.periodFrom=event.target.value;renderList(view);});
  $('#period-to')?.addEventListener('change',(event)=>{state.periodTo=event.target.value;renderList(view);});
  root.querySelectorAll('[data-action]').forEach((button)=>button.addEventListener('click',()=>onAction(view,button.dataset.action,button.dataset.id)));
  window.lucide?.createIcons();
}
function render() { if (!state.session) return; state.view === 'dashboard' ? renderDashboard() : renderList(state.view); }
function makeInput(field, value='') {
  const id = `field-${field.key}`; let control;
  if (field.type === 'select') {
    const opts = field.options === 'tutores' ? state.records.tutores.map((row)=>({value:row.id,label:row.nome_completo})) : field.options === 'animais' ? state.records.animais.map((row)=>({value:row.id,label:`${row.nome} · ${tutorName(row.tutor_id)}`})) : field.options.map((option,index)=>({value:option,label:field.labels?.[index] || option}));
    control = `<select id="${id}" name="${field.key}" ${field.required?'required':''}><option value="">Selecione…</option>${opts.map((opt)=>`<option value="${escapeHtml(opt.value)}" ${String(value)===String(opt.value)?'selected':''}>${escapeHtml(opt.label)}</option>`).join('')}</select>`;
  } else if (field.type === 'textarea') control = `<textarea id="${id}" name="${field.key}">${escapeHtml(value)}</textarea>`;
  else control = `<input id="${id}" name="${field.key}" type="${field.type || 'text'}" value="${escapeHtml(value)}" ${field.required?'required':''} ${field.step?`step="${field.step}"`:''} ${field.min?`min="${field.min}"`:''}>`;
  return `<label class="${field.wide?'wide':''}" for="${id}">${field.label}${control}</label>`;
}
function openForm(view, record=null) {
  if (view === 'animais' && !state.records.tutores.length) return flash('info','Cadastre um tutor primeiro.','O responsável precisa existir antes do cadastro do animal.');
  if (view === 'consultas' && !state.records.animais.length) return flash('info','Cadastre um animal primeiro.','Consultas precisam estar vinculadas a um animal.');
  $('#dialog-title').textContent = `${record?'Editar':'Novo'} ${view==='tutores'?'tutor':view==='animais'?'animal':'consulta'}`;
  $('#form-fields').innerHTML = schema[view].map((field)=>makeInput(field,record?.[field.key] ?? (field.key==='status'?'agendada':''))).join('');
  $('#record-form').dataset.view = view; $('#record-form').dataset.id = record?.id || '';
  if (view === 'consultas') $('#field-animal_id').addEventListener('change',(event)=>{const animal=state.records.animais.find((row)=>row.id===event.target.value);$('#field-animal_id').title=animal?`Tutor responsável: ${tutorName(animal.tutor_id)}`:'';});
  dialog.showModal(); window.lucide?.createIcons();
}
function validCpf(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const digit = (length) => { const sum = cpf.slice(0,length).split('').reduce((total,n,index)=>total + Number(n)*(length + 1 - index),0); const result = (sum*10)%11; return result === 10 ? 0 : result; };
  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}
function validate(view, values) {
  if (view === 'tutores') {
    const cpf = values.cpf.replace(/\D/g,''); if (!validCpf(cpf)) throw new Error('Informe um CPF válido com 11 dígitos.');
    if (!values.telefone.replace(/\D/g,'').match(/^\d{10,13}$/)) throw new Error('Informe um telefone válido com DDD.');
    if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) throw new Error('Informe um e-mail válido.');
  }
  if (view === 'animais' && values.peso && Number(values.peso) <= 0) throw new Error('O peso deve ser maior que zero.');
  if (view === 'consultas') {
    const animal=state.records.animais.find((row)=>row.id===values.animal_id); if (!animal) throw new Error('Selecione um animal cadastrado.');
    if (values.status === 'agendada' && values.data_consulta < today) throw new Error('Escolha uma data de hoje em diante para consultas agendadas.');
  }
}
async function handleSave(event) {
  event.preventDefault(); const form=event.currentTarget, view=form.dataset.view, id=form.dataset.id || null;
  const values=Object.fromEntries(new FormData(form).entries());
  Object.keys(values).forEach((key)=>{if(values[key]==='') values[key]=null;});
  try { validate(view,values); if (view==='tutores') values.cpf=values.cpf.replace(/\D/g,''); if(view==='animais' && values.peso) values.peso=Number(values.peso); await saveRecord(view,values,id,state.session.user.id); dialog.close(); await refresh(); await flash('success','Registro salvo.'); }
  catch(error) { await flash('error','Não foi possível salvar',error.message || 'Verifique os dados e tente novamente.'); }
}
async function onAction(view, action, id) {
  const record=state.records[view].find((row)=>row.id===id); if(!record) return;
  if(action==='edit') return openForm(view,record);
  if(action==='view') {
    const details=view==='tutores'?`<p><b>CPF:</b> ${escapeHtml(record.cpf)}</p><p><b>Telefone:</b> ${escapeHtml(record.telefone)}</p><p><b>E-mail:</b> ${escapeHtml(record.email||'—')}</p><p><b>Endereço:</b> ${escapeHtml(record.endereco||'—')}</p><p><b>Cadastro:</b> ${datePt(record.criado_em?.slice(0,10))}</p><p><b>Animais:</b> ${state.records.animais.filter((a)=>a.tutor_id===id).map((a)=>escapeHtml(a.nome)).join(', ')||'Nenhum'}`:view==='animais'?`<p><b>Espécie:</b> ${escapeHtml(record.especie)}</p><p><b>Raça:</b> ${escapeHtml(record.raca||'—')}</p><p><b>Sexo:</b> ${escapeHtml(record.sexo||'—')}</p><p><b>Nascimento:</b> ${datePt(record.data_nascimento)}</p><p><b>Peso:</b> ${escapeHtml(record.peso||'—')} kg</p><p><b>Cor:</b> ${escapeHtml(record.cor||'—')}</p><p><b>Tutor:</b> ${escapeHtml(tutorName(record.tutor_id))}</p><p><b>Observações:</b> ${escapeHtml(record.observacoes||'—')}</p><h3>Histórico de consultas</h3>${state.records.consultas.filter((c)=>c.animal_id===id).map((c)=>`<p>${datePt(c.data_consulta)} · ${escapeHtml(c.tipo)} · ${escapeHtml(c.status)} — ${escapeHtml(c.diagnostico||'Sem diagnóstico')}</p>`).join('')||'<p>Sem consultas registradas.</p>'}`:`<p><b>Animal:</b> ${escapeHtml(animalName(record.animal_id))}</p><p><b>Tutor:</b> ${escapeHtml(tutorName(state.records.animais.find((a)=>a.id===record.animal_id)?.tutor_id))}</p><p><b>Data:</b> ${datePt(record.data_consulta)} às ${escapeHtml(record.horario?.slice(0,5))}</p><p><b>Veterinário:</b> ${escapeHtml(record.veterinario)}</p><p><b>Tipo / status:</b> ${escapeHtml(record.tipo)} · ${escapeHtml(record.status)}</p><p><b>Sintomas:</b> ${escapeHtml(record.sintomas||'—')}</p><p><b>Diagnóstico:</b> ${escapeHtml(record.diagnostico||'—')}</p><p><b>Tratamento:</b> ${escapeHtml(record.tratamento||'—')}</p>`;
    return Swal.fire({title:escapeHtml(view==='tutores'?record.nome_completo:record.nome||'Consulta'),html:details,confirmButtonColor:'#1e3a8a',customClass:{popup:document.documentElement.classList.contains('dark')?'dark':''}});
  }
  const result=await Swal.fire({icon:'warning',title:'Excluir registro?',text:'O banco protegerá animais e consultas que tenham histórico vinculado.',showCancelButton:true,confirmButtonText:'Excluir',cancelButtonText:'Cancelar',confirmButtonColor:'#b42318',customClass:{popup:document.documentElement.classList.contains('dark')?'dark':''}});
  if(!result.isConfirmed) return;
  try { await deleteRecord(view,id); await refresh(); await flash('success','Registro excluído.'); }
  catch(error) { await flash('error','Exclusão não realizada',error.message?.includes('foreign key')?'Há registros vinculados. Remova ou transfira os dependentes antes.':error.message || 'A permissão RLS pode ter recusado a operação.'); }
}
function authError(error) { const msg=error?.message?.toLowerCase()||''; if(msg.includes('invalid login')||msg.includes('invalid credentials')) return 'E-mail ou senha incorretos.'; if(msg.includes('already registered')) return 'Este e-mail já possui uma conta.'; if(msg.includes('password should be')) return 'Use uma senha com pelo menos 6 caracteres.'; if(msg.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente novamente.'; return 'Não foi possível concluir. Confira os dados e tente novamente.'; }
async function authSubmit(event) {
  event.preventDefault(); const email=$('#auth-email').value.trim(), password=$('#auth-password').value;
  try {
    const action=$('#auth-form').dataset.action||'login'; let result;
    if(action==='signup') result=await supabase.auth.signUp({email,password}); else result=await supabase.auth.signInWithPassword({email,password});
    if(result.error) throw result.error;
    if(action==='signup' && !result.data.session) { $('#auth-message').textContent='Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre.'; return; }
    await acceptSession(result.data.session);
  } catch(error) { $('#auth-message').textContent=authError(error); }
}
async function acceptSession(session) {
  state.session=session; $('#access').classList.add('hidden'); $('#application').classList.remove('hidden'); $('#user-email').textContent=session.user.email; setView('dashboard'); await refresh();
}
function init() {
  setTheme(localStorage.getItem('vetcare-theme')==='dark');
  if(!configured) { $('#auth-message').textContent='Configure SUPABASE_URL e SUPABASE_ANON_KEY para conectar o projeto.'; $('#auth-submit').disabled=true; }
  $('#auth-form').addEventListener('submit',authSubmit);
  $('#signup-link').addEventListener('click',()=>{ $('#auth-form').dataset.action='signup'; $('#auth-submit').textContent='Criar conta'; $('#auth-password').autocomplete='new-password'; $('#login-title').textContent='Criar conta VetCare'; $('#auth-message').textContent=''; });
  $('#reset-link').addEventListener('click',async()=>{const email=$('#auth-email').value.trim();if(!email)return flash('info','Informe seu e-mail','Digite o e-mail da conta para receber o link.');try{const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:location.href});if(error)throw error;await flash('success','Link enviado','Confira sua caixa de entrada.');}catch(error){await flash('error','Não foi possível enviar',authError(error));}});
  $('#logout').addEventListener('click',async()=>{const {error}=await supabase.auth.signOut();if(error)return flash('error','Não foi possível sair',authError(error));state.session=null;$('#application').classList.add('hidden');$('#access').classList.remove('hidden');$('#auth-form').reset();$('#auth-form').dataset.action='login';$('#auth-submit').textContent='Entrar';$('#login-title').textContent='Bem-vindo à VetCare';});
  $('#theme-toggle').addEventListener('click',()=>setTheme(!document.documentElement.classList.contains('dark')));
  document.querySelectorAll('.nav-item[data-view]').forEach((button)=>button.addEventListener('click',()=>{setView(button.dataset.view);$('.sidebar').classList.remove('open');}));
  $('#mobile-menu').addEventListener('click',()=>$('.sidebar').classList.toggle('open'));
  $('#dialog-close').addEventListener('click',()=>dialog.close()); $('#dialog-cancel').addEventListener('click',()=>dialog.close()); $('#record-form').addEventListener('submit',handleSave);
  if(configured) supabase.auth.getSession().then(({data})=>{if(data.session) acceptSession(data.session);}).catch(()=>{});
  if(configured) supabase.auth.onAuthStateChange((_event,session)=>{if(!session){state.session=null;$('#application').classList.add('hidden');$('#access').classList.remove('hidden');}});
  if(configured) supabase.auth.onAuthStateChange((event,session)=>{
    if(event==='PASSWORD_RECOVERY' && session) {
      acceptSession(session);
      setTimeout(async()=>{
        const result=await Swal.fire({title:'Definir nova senha',input:'password',inputLabel:'A nova senha deve ter pelo menos 6 caracteres',inputAttributes:{minlength:6,autocomplete:'new-password'},showCancelButton:true,confirmButtonText:'Salvar senha',cancelButtonText:'Cancelar',confirmButtonColor:'#1e3a8a',inputValidator:(value)=>!value || value.length<6 ? 'Informe uma senha com pelo menos 6 caracteres.' : undefined});
        if(result.isConfirmed) { const {error}=await supabase.auth.updateUser({password:result.value}); if(error) await flash('error','Não foi possível atualizar a senha',authError(error)); else await flash('success','Senha atualizada.'); }
      },0);
    }
  });
  window.lucide?.createIcons();
}
init();








