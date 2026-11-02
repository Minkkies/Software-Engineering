// lib/courseSupabase.js — server admin guard for the course module
import { createClient } from './supabase/server';
import { redirect } from 'next/navigation';

export async function requireAdmin() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');
  
  const { data: profile } = await supabase.from('profiles').select('id, role').eq('id', session.user.id).single();
  if (!profile || !['admin', 'superadmin'].includes(profile.role)) redirect('/unauthorized');
  
  return { supabase, user: session.user };
}