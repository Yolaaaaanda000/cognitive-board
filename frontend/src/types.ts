
export type AgentType = 'Manager' | 'Socrates' | 'Feynman' | 'Pareto' | 'Elon' | 'User';

export enum Role {
  USER = 'user',
  AI = 'ai',
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  // Canvas Properties
  x: number;
  y: number;
  parentId?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  agent?: AgentType;
  content: string;
  thoughtLog?: string[]; // Parsed from the <thought> block
  timestamp: number;
  isStreaming?: boolean;
  referencedFiles?: string[]; // IDs of referenced files
}

export interface SelectionState {
  isVisible: boolean;
  x: number;
  y: number;
  text: string;
  isInChat?: boolean; // Whether selection is in chat messages area
}

// Conversation/Session Management
export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  notes: Note[];
  messages: Message[];
}

// File Upload Support
export type FileType = 'pdf' | 'txt' | 'md' | 'code' | 'other';

export interface UploadedFile {
  id: string;
  conversationId: string;
  name: string;
  type: FileType;
  size: number;
  content: string; // For text files, store content directly
  fileUri?: string; // For Gemini File API uploaded files
  uploadedAt: number;
  mimeType: string;
}

export const AGENTS_CONFIG = {
  Manager: { name: 'Manager', color: 'bg-gray-800', label: '思维中枢' },
  Socrates: { name: 'Socrates', color: 'bg-purple-600', label: '苏格拉底' },
  Feynman: { name: 'Feynman', color: 'bg-orange-500', label: '费曼技巧' },
  Pareto: { name: 'Pareto', color: 'bg-blue-600', label: '80/20法则' },
  Elon: { name: 'First Principles', color: 'bg-green-600', label: '第一性原理' },
  User: { name: 'You', color: 'bg-gray-200', label: '用户' },
};
