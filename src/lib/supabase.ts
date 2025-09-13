import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Типы определены локально в каждом файле для избежания проблем с импортом

export const CATEGORIES = [
  'Процессоры',
  'Видеокарты',
  'Материнские платы',
  'Оперативная память',
  'Накопители',
  'Блоки питания',
  'Корпуса',
  'Охлаждение',
  'Периферия',
  'Другое'
] as const

export type Category = typeof CATEGORIES[number]
