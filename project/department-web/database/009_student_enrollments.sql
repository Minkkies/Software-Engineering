-- 1. สร้างตาราง student_enrollments
CREATE TABLE IF NOT EXISTS public.student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    semester VARCHAR(20) NOT NULL,
    source VARCHAR(20) CHECK (source IN ('branch', 'mr30')),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    custom_course_code TEXT,
    custom_course_name TEXT,
    custom_credits INT,
    custom_sessions JSONB,
    custom_exam JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. เปิดสิทธิ์การใช้งาน (RLS)
ALTER TABLE public.student_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow individual student enrollments"
ON public.student_enrollments
FOR ALL
USING (auth.uid() = student_id)
WITH CHECK (auth.uid() = student_id);