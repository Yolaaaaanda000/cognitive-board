import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { Note } from '../types'

// 获取对话的所有笔记
export async function fetchNotesForConversation(
  conversationId: string
): Promise<Note[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching notes:', error)
    return [] // 降级：返回空数组而不是抛出错误
  }

  return (data || []).map(n => ({
    id: n.id,
    title: n.title,
    content: n.content,
    x: n.x,
    y: n.y,
    parentId: n.parent_id,
    updatedAt: new Date(n.updated_at).getTime()
  }))
}

// 创建笔记
export async function createNote(
  conversationId: string,
  userId: string,
  note: Omit<Note, 'id' | 'updatedAt'>
): Promise<Note> {
  if (!isSupabaseConfigured() || !supabase) {
    // 降级：创建一个临时 ID 的笔记对象
    const tempNote: Note = {
      ...note,
      id: Date.now().toString(),
      updatedAt: Date.now()
    }
    return tempNote
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      title: note.title,
      content: note.content,
      x: note.x,
      y: note.y,
      parent_id: note.parentId
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating note:', error)
    // 降级：返回一个临时 ID 的笔记
    return {
      ...note,
      id: Date.now().toString(),
      updatedAt: Date.now()
    }
  }

  return {
    id: data.id,
    title: data.title,
    content: data.content,
    x: data.x,
    y: data.y,
    parentId: data.parent_id,
    updatedAt: new Date(data.updated_at).getTime()
  }
}

// 更新笔记（使用 debounce）
let saveTimeout: NodeJS.Timeout | null = null
export async function updateNote(note: Note, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    return // 降级：静默失败
  }

  // 清除之前的定时器
  if (saveTimeout) clearTimeout(saveTimeout)
  
  // 防抖：500ms 后保存
  saveTimeout = setTimeout(async () => {
    const { error } = await supabase
      .from('notes')
      .update({
        title: note.title,
        content: note.content,
        x: note.x,
        y: note.y,
        parent_id: note.parentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', note.id)
      .eq('user_id', userId)

    if (error) {
      console.error('Error saving note:', error)
    }
  }, 500)
}

// 立即保存笔记（不使用 debounce）
export async function saveNoteImmediately(note: Note, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    return
  }

  const { error } = await supabase
    .from('notes')
    .update({
      title: note.title,
      content: note.content,
      x: note.x,
      y: note.y,
      parent_id: note.parentId,
      updated_at: new Date().toISOString()
    })
    .eq('id', note.id)
    .eq('user_id', userId)

  if (error) {
    console.error('Error saving note:', error)
    throw error
  }
}

// 删除笔记
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    return
  }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting note:', error)
    throw error
  }
}

