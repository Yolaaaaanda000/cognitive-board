import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { Message } from '../types'

// 获取对话的所有消息
export async function fetchMessagesForConversation(
  conversationId: string
): Promise<Message[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('timestamp', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    return []
  }

  return (data || []).map(m => ({
    id: m.id,
    role: m.role as 'user' | 'ai',
    agent: m.agent as any,
    content: m.content,
    thoughtLog: m.thought_log || undefined,
    referencedFiles: m.referenced_files || undefined,
    timestamp: m.timestamp,
    isStreaming: m.is_streaming || false
  }))
}

// 创建消息
export async function createMessage(
  conversationId: string,
  userId: string,
  message: Omit<Message, 'id'> & { id?: string }
): Promise<Message> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn('⚠️ createMessage: Supabase 未配置，消息未保存到数据库');
    // 降级：返回消息对象（不保存到数据库）
    return {
      ...message,
      id: message.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
  }

  const messageId = message.id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  console.log('💾 保存消息到数据库:', { conversationId, userId, role: message.role, contentLength: message.content?.length || 0 });

  const { data, error } = await supabase
    .from('messages')
    .insert({
      id: messageId,
      conversation_id: conversationId,
      user_id: userId,
      role: message.role,
      agent: message.agent,
      content: message.content,
      thought_log: message.thoughtLog || null,
      referenced_files: message.referencedFiles || null,
      timestamp: message.timestamp,
      is_streaming: message.isStreaming || false
    })
    .select()
    .single()

  if (error) {
    console.error('❌ Error creating message:', error)
    console.error('   错误详情:', JSON.stringify(error, null, 2));
    // 降级：返回消息对象
    return {
      ...message,
      id: messageId
    }
  }
  
  console.log('✅ 消息已成功保存到数据库:', data.id);

  return {
    id: data.id,
    role: data.role as 'user' | 'ai',
    agent: data.agent as any,
    content: data.content,
    thoughtLog: data.thought_log || undefined,
    referencedFiles: data.referenced_files || undefined,
    timestamp: data.timestamp,
    isStreaming: data.is_streaming || false
  }
}

// 更新消息（用于流式更新）
export async function updateMessage(
  messageId: string,
  updates: Partial<Message>,
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    return
  }

  const { error } = await supabase
    .from('messages')
    .update({
      content: updates.content,
      thought_log: updates.thoughtLog || null,
      agent: updates.agent,
      is_streaming: updates.isStreaming ?? undefined
    })
    .eq('id', messageId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error updating message:', error)
    // 不抛出错误，允许降级使用
  }
}

