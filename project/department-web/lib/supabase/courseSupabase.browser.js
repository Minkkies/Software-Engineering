// lib/supabase/courseSupabase.browser.js — client-safe Supabase factory
import { createClient } from './client';

let client;
export const browserSupabase = () => (client ??= createClient());