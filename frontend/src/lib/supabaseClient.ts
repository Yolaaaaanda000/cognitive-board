import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Missing Supabase environment variables. Database features will be disabled.')
  console.warn('⚠️ Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file')
} else {
  console.log('✅ Supabase 配置已加载')
  console.log('   URL:', supabaseUrl.substring(0, 30) + '...')
}

// 如果环境变量未设置，创建一个假的客户端以避免运行时错误
// 但在使用时需要检查
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseConfigured = () => {
  return supabase !== null
}

// 开发环境下暴露到 window（仅用于调试和验证）
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__supabase = supabase;
  (window as any).__isSupabaseConfigured = isSupabaseConfigured;
  console.log('🔧 调试模式：Supabase 客户端已暴露到 window.__supabase');
}

