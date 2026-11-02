// schedule/[termId]/page.js — Server Component: one term's courses + schedules + faculty
import { notFound } from 'next/navigation';
import { requireAdmin } from '../../../../../../lib/courseSupabase';
import { slugToTerm } from '../../../../../../lib/courseShared';
import TermDetailClient from './TermDetailClient';

export const dynamic = 'force-dynamic';

export default async function TermPage({ params }) {
  const { termId } = await params;                 // Next 15: params is a Promise (await is harmless on 14)
  const semester = slugToTerm(termId);
  if (!/^\d\/\d{4}$/.test(semester)) notFound();
  const { supabase } = await requireAdmin();
  const [{ data: courses }, { data: faculty }] = await Promise.all([
    supabase.from('courses').select('*, course_schedules(*)').eq('semester', semester).order('code'),
    supabase.from('faculty_members').select('*'),
  ]);
  if (!courses?.length) notFound();
  return <TermDetailClient semester={semester} initialCourses={courses} faculty={faculty ?? []} />;
}
