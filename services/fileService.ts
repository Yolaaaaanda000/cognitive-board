import { UploadedFile, FileType } from '../types';

// 文件类型检测
export const detectFileType = (fileName: string, mimeType: string): FileType => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  // PDF
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }
  
  // Markdown
  if (ext === 'md' || ext === 'markdown' || mimeType === 'text/markdown') {
    return 'md';
  }
  
  // Text
  if (ext === 'txt' || mimeType.startsWith('text/')) {
    return 'txt';
  }
  
  // Code files
  const codeExtensions = ['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bash', 'zsh', 'html', 'css', 'scss', 'less', 'json', 'xml', 'yaml', 'yml', 'sql', 'vue', 'svelte'];
  if (codeExtensions.includes(ext)) {
    return 'code';
  }
  
  return 'other';
};

// 读取文本文件内容
export const readTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// 读取 PDF 文件（返回文本内容，需要 PDF.js）
export const readPDFFile = async (file: File): Promise<string> => {
  // 注意：PDF 解析需要 pdf.js 库
  // 这里先返回一个占位符，实际使用时需要安装 pdf.js
  // npm install pdfjs-dist
  return new Promise((resolve, reject) => {
    // 临时方案：提示用户需要 PDF.js
    reject(new Error('PDF parsing requires pdf.js library. Please install: npm install pdfjs-dist'));
  });
};

// 处理文件上传
export const processFileUpload = async (
  file: File,
  conversationId: string
): Promise<UploadedFile> => {
  const fileType = detectFileType(file.name, file.type);
  let content = '';
  
  try {
    if (fileType === 'pdf') {
      // PDF 处理（需要 PDF.js）
      content = await readPDFFile(file);
    } else if (fileType === 'txt' || fileType === 'md' || fileType === 'code') {
      // 文本文件直接读取
      content = await readTextFile(file);
    } else {
      // 其他类型文件，尝试作为文本读取
      try {
        content = await readTextFile(file);
      } catch {
        content = `[Binary file: ${file.name}]`;
      }
    }
  } catch (error) {
    console.error('Error reading file:', error);
    content = `[Error reading file: ${error}]`;
  }
  
  const uploadedFile: UploadedFile = {
    id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
    conversationId,
    name: file.name,
    type: fileType,
    size: file.size,
    content,
    uploadedAt: Date.now(),
    mimeType: file.type,
  };
  
  return uploadedFile;
};

// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// 获取文件图标（根据类型返回对应的图标组件名称）
export const getFileIcon = (fileType: FileType): string => {
  switch (fileType) {
    case 'pdf':
      return 'File';
    case 'md':
      return 'FileText';
    case 'txt':
      return 'FileText';
    case 'code':
      return 'File';
    default:
      return 'File';
  }
};

