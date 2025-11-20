import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { UploadedFile } from '../types'

// 获取对话的所有文件
export async function fetchFilesForConversation(
  conversationId: string
): Promise<UploadedFile[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return []
  }

  const { data, error } = await supabase
    .from('uploaded_files')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('uploaded_at', { ascending: false })

  if (error) {
    console.error('Error fetching files:', error)
    return []
  }

  return (data || []).map(f => ({
    id: f.id,
    conversationId: f.conversation_id,
    name: f.name,
    type: f.type as any,
    size: f.size,
    content: f.content,
    fileUri: f.file_uri,
    uploadedAt: f.uploaded_at,
    mimeType: f.mime_type
  }))
}

// 保存文件
export async function saveFile(
  conversationId: string,
  userId: string,
  file: UploadedFile
): Promise<UploadedFile> {
  if (!isSupabaseConfigured() || !supabase) {
    // 降级：返回文件对象（不保存到数据库）
    return file
  }

  const { data, error } = await supabase
    .from('uploaded_files')
    .insert({
      id: file.id,
      conversation_id: conversationId,
      user_id: userId,
      name: file.name,
      type: file.type,
      size: file.size,
      content: file.content,
      file_uri: file.fileUri,
      mime_type: file.mimeType,
      uploaded_at: file.uploadedAt
    })
    .select()
    .single()

  if (error) {
    console.error('Error saving file:', error)
    // 降级：返回文件对象
    return file
  }

  return {
    id: data.id,
    conversationId: data.conversation_id,
    name: data.name,
    type: data.type as any,
    size: data.size,
    content: data.content,
    fileUri: data.file_uri,
    uploadedAt: data.uploaded_at,
    mimeType: data.mime_type
  }
}

// 删除文件
export async function deleteFile(
  fileId: string,
  userId: string
): Promise<void> {
  if (!isSupabaseConfigured() || !supabase) {
    return
  }

  const { error } = await supabase
    .from('uploaded_files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting file:', error)
    throw error
  }
}

