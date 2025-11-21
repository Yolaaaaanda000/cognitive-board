/**
 * 数据迁移工具：将 localStorage 中的数据迁移到 Supabase
 * 
 * 使用方法：
 * 1. 在浏览器控制台执行：window.__migrateToSupabase()
 * 2. 或者在代码中调用：migrateLocalStorageToSupabase(userId)
 */

import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { Conversation, Message, Note } from '../types';

export async function migrateLocalStorageToSupabase(userId: string): Promise<{
  success: boolean;
  conversations: number;
  messages: number;
  notes: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let conversationsMigrated = 0;
  let messagesMigrated = 0;
  let notesMigrated = 0;

  console.log('🔄 开始迁移 localStorage 数据到 Supabase...');
  
  if (!isSupabaseConfigured() || !supabase) {
    const error = 'Supabase 未配置，无法迁移';
    console.error('❌', error);
    return {
      success: false,
      conversations: 0,
      messages: 0,
      notes: 0,
      errors: [error]
    };
  }

  try {
    // 1. 迁移对话
    const storedConversations = localStorage.getItem('tf_conversations');
    if (storedConversations) {
      const conversations: Conversation[] = JSON.parse(storedConversations);
      console.log(`📦 找到 ${conversations.length} 个对话需要迁移`);

      for (const conv of conversations) {
        try {
          // 检查对话是否已存在
          const { data: existing } = await supabase
            .from('conversations')
            .select('id')
            .eq('id', conv.id)
            .single();

          if (existing) {
            console.log(`⏭️ 对话 ${conv.id} 已存在，跳过`);
            conversationsMigrated++;
            continue;
          }

          // 创建对话
          const { error: convError } = await supabase
            .from('conversations')
            .insert({
              id: conv.id,
              user_id: userId,
              title: conv.title,
              created_at: new Date(conv.createdAt).toISOString(),
              updated_at: new Date(conv.updatedAt).toISOString(),
            });

          if (convError) {
            console.error(`❌ 迁移对话失败 ${conv.id}:`, convError);
            errors.push(`对话 ${conv.id}: ${convError.message}`);
            continue;
          }

          console.log(`✅ 已迁移对话: ${conv.title}`);
          conversationsMigrated++;

          // 2. 迁移消息
          if (conv.messages && conv.messages.length > 0) {
            for (const msg of conv.messages) {
              try {
                const { error: msgError } = await supabase
                  .from('messages')
                  .insert({
                    id: msg.id,
                    conversation_id: conv.id,
                    user_id: userId,
                    role: msg.role,
                    agent: msg.agent || null,
                    content: msg.content,
                    thought_log: msg.thoughtLog || null,
                    referenced_files: msg.referencedFiles || null,
                    timestamp: msg.timestamp,
                    is_streaming: msg.isStreaming || false,
                  });

                if (msgError) {
                  console.error(`❌ 迁移消息失败 ${msg.id}:`, msgError);
                  errors.push(`消息 ${msg.id}: ${msgError.message}`);
                  continue;
                }

                messagesMigrated++;
              } catch (msgErr) {
                errors.push(`消息 ${msg.id}: ${msgErr instanceof Error ? msgErr.message : String(msgErr)}`);
              }
            }
          }

          // 3. 迁移笔记
          if (conv.notes && conv.notes.length > 0) {
            for (const note of conv.notes) {
              try {
                const { error: noteError } = await supabase
                  .from('notes')
                  .insert({
                    id: note.id,
                    conversation_id: conv.id,
                    user_id: userId,
                    title: note.title,
                    content: note.content,
                    x: note.x || 0,
                    y: note.y || 0,
                    parent_id: note.parentId || null,
                    updated_at: new Date(note.updatedAt).toISOString(),
                  });

                if (noteError) {
                  console.error(`❌ 迁移笔记失败 ${note.id}:`, noteError);
                  errors.push(`笔记 ${note.id}: ${noteError.message}`);
                  continue;
                }

                notesMigrated++;
              } catch (noteErr) {
                errors.push(`笔记 ${note.id}: ${noteErr instanceof Error ? noteErr.message : String(noteErr)}`);
              }
            }
          }
        } catch (convErr) {
          errors.push(`对话 ${conv.id}: ${convErr instanceof Error ? convErr.message : String(convErr)}`);
        }
      }
    }

    const success = errors.length === 0;
    console.log('\n=== 迁移完成 ===');
    console.log(`✅ 对话: ${conversationsMigrated}`);
    console.log(`✅ 消息: ${messagesMigrated}`);
    console.log(`✅ 笔记: ${notesMigrated}`);
    if (errors.length > 0) {
      console.log(`❌ 错误: ${errors.length}`);
      console.error('错误列表:', errors);
    }

    return {
      success,
      conversations: conversationsMigrated,
      messages: messagesMigrated,
      notes: notesMigrated,
      errors
    };
  } catch (error) {
    console.error('❌ 迁移过程出错:', error);
    return {
      success: false,
      conversations: conversationsMigrated,
      messages: messagesMigrated,
      notes: notesMigrated,
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

// 在开发环境下暴露到 window
if (typeof window !== 'undefined') {
  (window as any).__migrateToSupabase = async (userId?: string) => {
    if (!userId) {
      // 尝试从 Supabase session 获取用户 ID
      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          userId = session.user.id;
          console.log('✅ 从 session 获取用户 ID:', userId);
        } else {
          console.error('❌ 未找到用户，请先登录');
          return;
        }
      } else {
        console.error('❌ Supabase 未配置');
        return;
      }
    }

    return migrateLocalStorageToSupabase(userId);
  };
}


