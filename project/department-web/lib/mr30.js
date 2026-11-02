// lib/mr30.js
const BUCKET = 'mr30';

export async function getPublishedMr30Url(supabase, semester) {
  const { data, error } = await supabase
    .from('mr30_documents')
    .select('file_path')
    .eq('semester', semester)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;

  const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(data.file_path, 3600);
  return signed?.signedUrl ?? supabase.storage.from(BUCKET).getPublicUrl(data.file_path).data.publicUrl;
}