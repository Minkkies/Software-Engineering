// app/(backend)/Admin/course/page.js — Server Component: hub for the two modules
import { requireAdmin } from '../../../../lib/courseSupabase';
import CourseClient from './CourseClient';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'จัดการหลักสูตร | CS Info Portal' };

export default async function CoursePage() {
  const { supabase } = await requireAdmin();
  const [{ count: termCourses }, { count: docs }] = await Promise.all([
    supabase.from('courses').select('*', { count: 'exact', head: true }),
    supabase.from('mr30_documents').select('*', { count: 'exact', head: true }),
  ]);
  return <CourseClient stats={{ courses: termCourses ?? 0, docs: docs ?? 0 }} />;
}