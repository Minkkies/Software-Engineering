// mr30/page.js — Server Component
import { requireAdmin } from '../../../../../lib/courseSupabase';
import Mr30Client from './Mr30Client';

export const dynamic = 'force-dynamic';

export default async function Mr30Page() {
  const { supabase, user } = await requireAdmin();
  const { data } = await supabase.from('mr30_documents').select('*, uploader:uploaded_by(full_name)').order('created_at', { ascending: false });
  return <Mr30Client initialDocs={data ?? []} adminId={user.id} />;
}
