import { supabase } from './supabase.js';
const tables = { tutores: 'tutores', animais: 'animais', consultas: 'consultas' };
export async function loadRecords() {
  const results = await Promise.all(Object.values(tables).map((table) => supabase.from(table).select('*')));
  const error = results.find((result) => result.error)?.error;
  if (error) throw error;
  return { tutores: results[0].data || [], animais: results[1].data || [], consultas: results[2].data || [] };
}
export async function saveRecord(view, values, id, userId) {
  const table = tables[view];
  const payload = { ...values, usuario_id: userId };
  let query = id ? supabase.from(table).update(payload).eq('id', id) : supabase.from(table).insert(payload);
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data;
}
export async function deleteRecord(view, id) {
  const { error } = await supabase.from(tables[view]).delete().eq('id', id);
  if (error) throw error;
}
