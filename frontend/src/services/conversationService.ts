import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { Conversation, Note, Message } from '../types'
import { fetchNotesForConversation } from './noteService'
import { fetchMessagesForConversation } from './messageService'

// 获取用户的所有对话
export async function fetchConversations(userId: string): Promise<Conversation[]> {
  if (!isSupabaseConfigured() || !supabase) {
    // 如果 Supabase 未配置，返回空数组（降级到 localStorage）
    console.warn('⚠️ fetchConversations: Supabase 未配置，返回空数组');
    return []
  }

  console.log('🔄 从数据库获取对话，用户 ID:', userId);
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching conversations:', error)
    console.error('   错误详情:', JSON.stringify(error, null, 2));
    throw error
  }
  
  console.log('✅ 成功获取对话，数量:', data?.length || 0);

  // 需要加载每个对话的 notes 和 messages
  const conversations: Conversation[] = []
  for (const conv of data || []) {
    console.log(`🔄 加载对话 "${conv.title}" (${conv.id}) 的笔记和消息...`);
    const [notes, messages] = await Promise.all([
      fetchNotesForConversation(conv.id),
      fetchMessagesForConversation(conv.id)
    ])
    
    console.log(`✅ 对话 "${conv.title}": 笔记 ${notes.length} 个，消息 ${messages.length} 个 (AI: ${messages.filter(m => m.role === 'ai').length}, 用户: ${messages.filter(m => m.role === 'user').length})`);
    
    conversations.push({
      id: conv.id,
      title: conv.title,
      createdAt: new Date(conv.created_at).getTime(),
      updatedAt: new Date(conv.updated_at).getTime(),
      notes,
      messages
    })
  }

  console.log(`✅ 所有对话加载完成，共 ${conversations.length} 个对话`);
  return conversations
}

// 创建新对话
export async function createConversation(
  userId: string,
  title: string
): Promise<Conversation> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('❌ createConversation: Supabase 未配置');
    throw new Error('Supabase is not configured')
  }

  console.log('💾 创建新对话到数据库:', { userId, title });
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      title,
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating conversation:', error)
    console.error('   错误详情:', JSON.stringify(error, null, 2));
    throw error
  }
  
  console.log('✅ 对话已成功保存到数据库:', data.id);

  return {
    id: data.id,
    title: data.title,
    createdAt: new Date(data.created_at).getTime(),
    updatedAt: new Date(data.updated_at).getTime(),
    notes: [],
    messages: []
  }
}

// 更新对话
export async function updateConversation(
  conversationId: string,
  updates: { title?: string }
): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    return // 降级处理：如果未配置，静默失败
  }

  const { error } = await supabase
    .from('conversations')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', conversationId)

  if (error) {
    console.error('Error updating conversation:', error)
    throw error
  }
}

// 删除对话
export async function deleteConversation(conversationId: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    return // 降级处理
  }

  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('id', conversationId)

  if (error) {
    console.error('Error deleting conversation:', error)
    throw error
  }
}

