
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  MessageSquare, 
  Sparkles, 
  Mic, 
  ChevronRight, 
  ChevronDown, 
  Brain, 
  Lightbulb, 
  Target, 
  Search, 
  Feather,
  MoreHorizontal,
  ArrowRight,
  X,
  LogOut,
  User,
  Plus,
  Minus,
  FileText,
  Trash2,
  Network,
  Download
} from './components/Icons';
import { sendMessageStreamToGemini } from './services/geminiService';
import { AgentType, Message, SelectionState, AGENTS_CONFIG, User as UserType, Note } from './types';
import { INITIAL_NOTE_CONTENT } from './constants';
import AuthPage from './components/AuthPage';

// --- Helper Components ---

function MenuButton({ icon: Icon, label, onClick, activeColor = "text-gray-700" }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center space-x-1.5 px-2.5 py-1.5 hover:bg-gray-50 rounded-md transition-colors group"
    >
      <Icon className={`w-3.5 h-3.5 ${activeColor}`} />
      <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900">{label}</span>
    </button>
  );
}

function HintPill({ text, icon: Icon, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex-shrink-0 flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition shadow-sm"
    >
      <Icon className="w-3 h-3" />
      <span>{text}</span>
    </button>
  );
}

function ThoughtLog({ logs }: { logs: string[] }) {
  const [isOpen, setIsOpen] = useState(true);
  if (!logs || logs.length === 0) return null;

  return (
    <div className="mb-3 ml-1 max-w-[95%]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 text-[10px] text-gray-400 hover:text-gray-600 transition mb-1.5"
      >
        <div className={`transform transition-transform duration-200 ${isOpen ? 'rotate-0' : '-rotate-90'}`}>
           <ChevronDown className="w-3 h-3" />
        </div>
        <span className="uppercase tracking-wider font-bold">Thinking Process</span>
      </button>
      
      {isOpen && (
        <div className="bg-gray-50 border-l-2 border-gray-200 pl-3 py-2 space-y-1.5 rounded-r-lg text-[11px] text-gray-500 font-mono leading-tight shadow-sm">
          {logs.map((log, idx) => (
            <div key={idx} className="flex items-start">
               <span className="mr-2 opacity-40 select-none">{'>'}</span>
               <span className="opacity-90">{log.replace(/^- /, '')}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Canvas Component ---

interface CanvasViewProps {
  notes: Note[];
  activeNoteId: string;
  onNoteClick: (id: string) => void;
  onNoteMove: (id: string, x: number, y: number) => void;
}

const CanvasView: React.FC<CanvasViewProps> = ({ notes, activeNoteId, onNoteClick, onNoteMove }) => {
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ mouseX: 0, mouseY: 0, noteX: 0, noteY: 0 });
  const [scale, setScale] = useState(1);
  
  // Ref to track if a drag actually happened to prevent accidental clicks
  const isDragOperation = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Simple line rendering
  const renderConnections = () => {
    return notes.map(note => {
      if (!note.parentId) return null;
      const parent = notes.find(n => n.id === note.parentId);
      if (!parent) return null;

      // Draw line from center to center
      const x1 = parent.x + 100; // approximate center width
      const y1 = parent.y + 40;  // approximate center height
      const x2 = note.x + 100;
      const y2 = note.y + 40;

      return (
        <line 
          key={`line-${parent.id}-${note.id}`}
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#e5e7eb"
          strokeWidth="2"
        />
      );
    });
  };

  const handleMouseDown = (e: React.MouseEvent, noteId: string, x: number, y: number) => {
    e.stopPropagation();
    setIsDragging(noteId);
    isDragOperation.current = false; // Reset drag status on mouse down
    // Capture initial state so we can calculate deltas relative to scale
    setDragStart({ mouseX: e.clientX, mouseY: e.clientY, noteX: x, noteY: y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      // Calculate distance moved in screen pixels, then divide by scale 
      // to translate to canvas coordinates
      const rawDeltaX = e.clientX - dragStart.mouseX;
      const rawDeltaY = e.clientY - dragStart.mouseY;
      
      // If moved more than a tiny threshold, mark as drag operation
      if (Math.abs(rawDeltaX) > 3 || Math.abs(rawDeltaY) > 3) {
          isDragOperation.current = true;
      }

      const deltaX = rawDeltaX / scale;
      const deltaY = rawDeltaY / scale;
      
      onNoteMove(isDragging, dragStart.noteX + deltaX, dragStart.noteY + deltaY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  const handleNoteClick = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      // Only open note if we didn't just drag it
      if (!isDragOperation.current) {
          onNoteClick(id);
      }
      isDragOperation.current = false;
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.2));

  return (
    <div 
      ref={containerRef}
      className="w-full h-full overflow-auto relative bg-gray-50 cursor-grab active:cursor-grabbing"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Scalable Container */}
      <div 
        className="w-[3000px] h-[3000px] relative transition-transform duration-100 origin-top-left"
        style={{ transform: `scale(${scale})` }}
      >
        
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
          {renderConnections()}
        </svg>

        {notes.map(note => (
          <div
            key={note.id}
            className={`absolute w-[200px] p-3 rounded-xl border shadow-sm bg-white transition-shadow hover:shadow-md z-10 cursor-pointer
              ${activeNoteId === note.id ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-gray-200'}
            `}
            style={{ left: note.x, top: note.y }}
            onClick={(e) => handleNoteClick(e, note.id)}
            onMouseDown={(e) => handleMouseDown(e, note.id, note.x, note.y)}
          >
            <div className="flex items-center gap-2 mb-2 opacity-50 pointer-events-none">
              <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center">
                <FileText className="w-3 h-3" />
              </div>
              <span className="text-[10px] font-mono uppercase">{new Date(note.updatedAt).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</span>
            </div>
            <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1 pointer-events-none select-none">
              {note.title || 'Untitled Idea'}
            </h3>
            <p className="text-[10px] text-gray-400 line-clamp-3 pointer-events-none select-none">
              {note.content.replace(/<[^>]*>?/gm, '').substring(0, 50) || 'Empty note...'}
            </p>
            {/* Drag Handle Visual Hint */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-white border border-gray-200 rounded-full shadow cursor-move flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
               <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-6 right-6 flex items-center bg-white rounded-lg shadow-md border border-gray-200 p-1 gap-1 z-20">
        <button 
          onClick={zoomOut}
          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-xs font-mono w-10 text-center text-gray-500">{Math.round(scale * 100)}%</span>
        <button 
          onClick={zoomIn}
          className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};


// --- Workspace Component (Authenticated View) ---

interface WorkspaceProps {
  user: UserType;
  onLogout: () => void;
}

function Workspace({ user, onLogout }: WorkspaceProps) {
  // --- Note State ---
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string>('');
  const [isNotePanelOpen, setIsNotePanelOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'canvas'>('canvas');
  
  // --- Chat & UI State ---
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'ai',
      agent: 'Manager',
      content: `Hello, ${user.name.split(' ')[0]}. I'm ThinkFlow. \n\nI can help you brainstorm, plan, or analyze complex topics. Notes are visualized as a knowledge graph on the left. \n\nWhat's on your mind?`,
      timestamp: Date.now()
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [selection, setSelection] = useState<SelectionState>({ isVisible: false, x: 0, y: 0, text: '' });
  const [isThinking, setIsThinking] = useState(false);
  const [activeAgent, setActiveAgent] = useState<AgentType>('Manager');
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false); // For detailed editing

  const editorRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // --- Initialization ---
  useEffect(() => {
    const storedNotes = localStorage.getItem('tf_notes');
    if (storedNotes) {
      const parsed = JSON.parse(storedNotes);
      setNotes(parsed);
      if (parsed.length > 0) {
        setActiveNoteId(parsed[0].id);
      } else {
        createDefaultNote();
      }
    } else {
      createDefaultNote();
    }
  }, []);

  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('tf_notes', JSON.stringify(notes));
    }
  }, [notes]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  // --- Note Management Handlers ---

  const createDefaultNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Root Idea',
      content: INITIAL_NOTE_CONTENT,
      updatedAt: Date.now(),
      x: 100,
      y: 100
    };
    setNotes([newNote]);
    setActiveNoteId(newNote.id);
  };

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'New Node',
      content: '',
      updatedAt: Date.now(),
      x: 150,
      y: 150
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    setIsDetailViewOpen(true);
  };

  const handleDeleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    if (activeNoteId === id) {
      if (updatedNotes.length > 0) {
        setActiveNoteId(updatedNotes[0].id);
      } else {
        createDefaultNote(); 
      }
    }
    setIsDetailViewOpen(false);
  };

  const handleDownloadNotes = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `thinkflow_notes_${new Date().toISOString().slice(0,10)}.json`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const updateActiveNote = (title?: string, content?: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id === activeNoteId) {
        return {
          ...n,
          title: title !== undefined ? title : n.title,
          content: content !== undefined ? content : n.content,
          updatedAt: Date.now()
        };
      }
      return n;
    }));
  };

  const handleNoteMove = (id: string, x: number, y: number) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, x, y } : n));
  };

  const activeNote = notes.find(n => n.id === activeNoteId) || notes[0];

  // --- Spawning Logic ---
  
  // Used when AI branches out a thought into a new node
  const spawnChildNote = (parentId: string, initialTitle: string, initialContent: string) => {
    const parent = notes.find(n => n.id === parentId) || notes[0];
    
    // Calculate position: Sprout to the right with random vertical offset
    const baseX = parent.x + 250;
    const baseY = parent.y + (Math.random() * 200 - 100); // +/- 100px vertical spread

    const newId = Date.now().toString();
    const newNote: Note = {
      id: newId,
      title: initialTitle,
      content: initialContent,
      updatedAt: Date.now(),
      parentId: parentId,
      x: baseX,
      y: baseY
    };

    setNotes(prev => [...prev, newNote]);
    setActiveNoteId(newId); // Switch focus to new child
    return newId;
  };

  // --- AI Stream Logic ---
  const handleAIStream = async (agent: AgentType, prompt: string, targetNoteId?: string) => {
    setIsThinking(true);
    
    const responseId = Date.now().toString() + '-ai';

    const newMessage: Message = {
      id: responseId,
      role: 'ai',
      agent: agent,
      content: '',
      thoughtLog: [],
      timestamp: Date.now(),
      isStreaming: true
    };
    setMessages(prev => [...prev, newMessage]);

    // Initial Target ID (might change if dynamic branching occurs)
    let currentTargetId = targetNoteId || activeNoteId;
    let hasBranched = false;

    try {
      const stream = sendMessageStreamToGemini(prompt);
      let rawAccumulated = '';
      
      for await (const chunk of stream) {
        if (!chunk) continue;
        rawAccumulated += chunk;

        // --- 0. Check for Automatic Branching Tag ---
        // Syntax: <create_branch title="Title Here" />
        const branchTagRegex = /<create_branch\s+title="([^"]+)"\s*\/>/i;
        const branchMatch = rawAccumulated.match(branchTagRegex);

        if (branchMatch && !hasBranched) {
           const newTitle = branchMatch[1];
           // Dynamically spawn a new child node from the current one
           const newId = spawnChildNote(activeNoteId, newTitle, ""); 
           currentTargetId = newId; // Redirect future content to this new node
           hasBranched = true;
           // We leave the tag in rawAccumulated for now to not break parsing logic, 
           // but we will strip it from the chat view below.
        }

        // --- 1. Parse Thoughts ---
        const thoughtBlockRegex = /<thought>([\s\S]*?)(?:<\/\s*thought>|$)/i;
        const closedThoughtBlockRegex = /<thought>([\s\S]*?)<\/\s*thought>/i;
        
        let cleanContent = rawAccumulated;
        // Remove the branch tag from the visual chat
        cleanContent = cleanContent.replace(branchTagRegex, '');

        let parsedThoughts: string[] = [];

        const thoughtMatch = rawAccumulated.match(closedThoughtBlockRegex);
        
        if (thoughtMatch) {
          parsedThoughts = thoughtMatch[1].split('\n').map(t => t.trim()).filter(t => t.length > 0);
          cleanContent = cleanContent.replace(closedThoughtBlockRegex, '');
        } else if (rawAccumulated.match(/<thought>/i)) {
          const openMatch = rawAccumulated.match(thoughtBlockRegex);
          if (openMatch) {
             parsedThoughts = openMatch[1].split('\n').map(t => t.trim()).filter(t => t.length > 0);
          }
          if (!rawAccumulated.match(/<\/\s*thought>/i)) {
              // If thought block is still open, don't show incomplete thoughts in main chat
              // But we still want to show the REST of the content if any exists before it
              cleanContent = cleanContent.split('<thought>')[0];
          } else {
             cleanContent = cleanContent.replace(thoughtBlockRegex, '');
          }
        }

        // --- 2. Parse Note Content ---
        const noteBlockRegex = /<note_content>([\s\S]*?)(?:<\/\s*note_content>|$)/i;
        const closedNoteBlockRegex = /<note_content>([\s\S]*?)<\/\s*note_content>/i;
        
        const noteMatch = rawAccumulated.match(closedNoteBlockRegex);
        
        // Helper to update specific note
        const updateSpecificNote = (id: string, text: string) => {
             setNotes(prev => prev.map(n => {
              if (n.id === id) {
                // Extract title from first line if it looks like a header
                const lines = text.split('\n');
                const potentialTitle = lines[0].startsWith('#') ? lines[0].replace(/^#+\s*/, '').substring(0, 30) : n.title;
                
                return { 
                  ...n, 
                  content: text, 
                  title: potentialTitle, 
                  updatedAt: Date.now() 
                };
              }
              return n;
            }));
        };

        if (noteMatch) {
           const newNoteContent = noteMatch[1].trim();
           updateSpecificNote(currentTargetId, newNoteContent);
           cleanContent = cleanContent.replace(closedNoteBlockRegex, '');
        } else if (rawAccumulated.match(/<note_content>/i)) {
           const openNoteMatch = rawAccumulated.match(noteBlockRegex);
           if (openNoteMatch) {
             updateSpecificNote(currentTargetId, openNoteMatch[1]);
           }
           cleanContent = cleanContent.replace(noteBlockRegex, '');
        }

        setMessages(prev => prev.map(msg => 
          msg.id === responseId 
            ? { ...msg, content: cleanContent.trim(), thoughtLog: parsedThoughts } 
            : msg
        ));
      }

      setMessages(prev => prev.map(msg => {
        if (msg.id !== responseId) return msg;
        return { ...msg, isStreaming: false };
      }));

    } catch (e) {
      console.error(e);
      setMessages(prev => prev.map(msg => 
        msg.id === responseId 
          ? { ...msg, content: "I encountered a connection error. Please try again." } 
          : msg
      ));
    } finally {
      setIsThinking(false);
    }
  };

  // --- Selection Handlers (Branching Logic) ---
  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !editorRef.current?.contains(sel.anchorNode)) {
      setTimeout(() => {}, 100);
      return;
    }

    const text = sel.toString();
    if (text.trim().length === 0) {
      setSelection({ ...selection, isVisible: false });
      return;
    }

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    setSelection({
      isVisible: true,
      x: rect.left + (rect.width / 2),
      y: rect.top - 10, 
      text: text
    });
  };

  // Manual Branching via Menu
  const handleBranchOut = (selectedAgent: AgentType) => {
     setSelection({ ...selection, isVisible: false });
     
     // 1. Create Child Node
     const childId = spawnChildNote(activeNoteId, `Thinking about: "${selection.text.substring(0, 15)}..."`, "Generating analysis...");
     
     // 2. Send Request
     // If Manager is selected, we specifically ask for auto-routing in the prompt
     const agentInstruction = selectedAgent === 'Manager' 
        ? "ACT AS AGENT: Manager (Auto-Router). Analyze the request and dynamically adopt the best persona (Socrates, Feynman, etc.) for the response. State your persona choice in the <thought> block."
        : `ACT AS AGENT: ${selectedAgent}.`;

     const prompt = `${agentInstruction}
     CONTEXT: The user is exploring a specific sub-point from a parent note.
     PARENT NOTE CONTEXT: "${activeNote.content}"
     SELECTED TEXT TO EXPAND: "${selection.text}"
     TASK: Create a detailed analysis or expansion on this selected text. Structure the output within <note_content> to fill this new node.`;

     const userMsg: Message = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: `Branching out from selection: "${selection.text}"`,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);

    // 3. Stream into the CHILD node
    handleAIStream(selectedAgent, prompt, childId);
  };

  const handleSendMessage = (text?: string) => {
    const msgText = text || inputVal;
    if (!msgText.trim()) return;
    
    const userMsg: Message = {
      id: Date.now().toString() + '-user',
      role: 'user',
      content: msgText,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputVal('');

    if(inputRef.current) inputRef.current.style.height = 'auto';

    // Standard Chat - But ask AI to categorize if it's a branch
    const agentInstruction = activeAgent === 'Manager'
       ? "ACT AS AGENT: Manager (Auto-Router). Analyze the user input. Decide if you should answer directly OR switch to a specific persona (e.g., Socrates for questions, Feynman for explanations). State your decision in <thought>."
       : `ACT AS AGENT: ${activeAgent}.`;

    const prompt = `${agentInstruction}
    
    USER INPUT: "${msgText}".
    
    CONTEXT - CURRENT NODE:
    ID: ${activeNoteId}
    Title: ${activeNote.title}
    Content: ${activeNote.content}
    
    INSTRUCTION:
    1. Analyze user intent.
    2. IF the user asks a sub-question, a deep dive, or about a tangent related to the current node, output <create_branch title="Topic Name" /> immediately after the thought block.
    3. IF the user is just adding info to the current topic, do NOT branch, just use <note_content>.
    4. Update the relevant note content.
    5. Reply to user.`;

    // We pass activeNoteId as default target, but the stream handler might override it if <create_branch> is detected
    handleAIStream(activeAgent, prompt, activeNoteId);
  };

  // --- Render ---

  if (!activeNote) return <div>Loading...</div>;

  return (
    <div className="flex h-screen w-full bg-white text-gray-900 font-sans overflow-hidden selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. Narrow Navigation Rail */}
      <div className="w-16 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-6 space-y-6 z-30 flex-shrink-0 shadow-sm">
        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg cursor-pointer hover:scale-105 transition">
          <Brain className="text-white w-6 h-6" />
        </div>
        
        <div className="flex-1 w-full flex flex-col items-center space-y-4 pt-4">
           <button 
             onClick={handleCreateNote}
             className="p-2 rounded-lg bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition relative group"
             title="New Note Node"
           >
             <Feather className="w-5 h-5"/>
           </button>

           <div className="w-8 h-px bg-gray-200"></div>

           <button 
             onClick={() => setViewMode(viewMode === 'canvas' ? 'list' : 'canvas')}
             className={`p-2 rounded-lg transition ${viewMode === 'canvas' ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-200 text-gray-400'}`}
             title="Toggle Canvas View"
           >
             <Network className="w-5 h-5"/>
           </button>

           <button 
             onClick={() => setIsNotePanelOpen(!isNotePanelOpen)}
             className={`p-2 rounded-lg transition ${!isNotePanelOpen ? 'bg-red-50 text-red-400' : 'hover:bg-gray-200 text-gray-400'}`}
             title="Toggle Panel"
           >
             <FileText className="w-5 h-5"/>
           </button>

           <button 
             onClick={handleDownloadNotes}
             className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 transition"
             title="Download Notes (JSON)"
           >
             <Download className="w-5 h-5"/>
           </button>
        </div>
        
        <div className="relative group">
          <button className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 to-blue-500 shadow-md flex items-center justify-center text-white text-xs font-bold">
            {user.name.charAt(0)}
          </button>
          <div className="absolute left-full bottom-0 ml-2 mb-[-10px] w-32 bg-white rounded-lg shadow-xl border border-gray-100 py-1 hidden group-hover:block z-50">
            <button onClick={onLogout} className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2">
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* 2. Left Panel: Canvas OR List */}
      {isNotePanelOpen && (
        <div className="w-[50%] bg-gray-50 border-r border-gray-200 flex flex-col h-full relative transition-all duration-300 ease-in-out">
          
          {/* Panel Header */}
          <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white z-20 shadow-sm">
             <span className="font-bold text-sm text-gray-700 flex items-center gap-2">
                {viewMode === 'canvas' ? <Network className="w-4 h-4"/> : <FileText className="w-4 h-4"/>}
                {viewMode === 'canvas' ? 'Knowledge Graph' : 'All Notes'}
             </span>
             <div className="text-xs text-gray-400">
                {notes.length} nodes active
             </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 relative overflow-hidden">
             {viewMode === 'canvas' ? (
                <CanvasView 
                  notes={notes} 
                  activeNoteId={activeNoteId} 
                  onNoteClick={(id) => { setActiveNoteId(id); setIsDetailViewOpen(true); }}
                  onNoteMove={handleNoteMove}
                />
             ) : (
                <div className="p-4 space-y-2 overflow-y-auto h-full">
                   {notes.map(note => (
                     <div 
                       key={note.id}
                       onClick={() => { setActiveNoteId(note.id); setIsDetailViewOpen(true); }}
                       className={`p-4 rounded-xl border cursor-pointer transition-all ${activeNoteId === note.id ? 'bg-white border-indigo-500 shadow-md' : 'bg-white border-gray-200 hover:border-gray-300'}`}
                     >
                        <h3 className="font-bold text-gray-800">{note.title || 'Untitled'}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">{note.content.replace(/<[^>]*>?/gm, '')}</p>
                     </div>
                   ))}
                </div>
             )}
          </div>

          {/* Overlay: Detail Editor View (Slides over Canvas) */}
          {isDetailViewOpen && activeNote && (
             <div className="absolute top-14 bottom-0 left-0 right-0 bg-white z-30 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-200">
                <div className="h-12 border-b border-gray-100 flex items-center justify-between px-6 bg-gray-50/50">
                  <button onClick={() => setIsDetailViewOpen(false)} className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1">
                    <ChevronDown className="w-3 h-3 rotate-90" /> Back to Canvas
                  </button>
                  <div className="flex items-center gap-2">
                     <button onClick={(e) => handleDeleteNote(e, activeNote.id)} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-4 h-4"/></button>
                     <button onClick={() => setIsDetailViewOpen(false)} className="p-1.5 hover:bg-gray-200 rounded"><X className="w-4 h-4"/></button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8">
                   <input 
                     className="text-2xl font-bold text-gray-900 w-full outline-none placeholder-gray-300 mb-6 bg-transparent"
                     value={activeNote.title}
                     onChange={(e) => updateActiveNote(e.target.value)}
                     placeholder="Untitled Node"
                   />
                   <div 
                     ref={editorRef}
                     className="prose prose-sm max-w-none outline-none text-gray-700 leading-relaxed whitespace-pre-wrap"
                     onMouseUp={handleMouseUp}
                     contentEditable={true}
                     onBlur={(e) => updateActiveNote(undefined, e.currentTarget.innerText)}
                     suppressContentEditableWarning={true}
                   >
                     {activeNote.content}
                   </div>
                </div>

                {/* Context Menu inside Editor */}
                {selection.isVisible && (
                  <div 
                    className="fixed z-50 flex items-center bg-white border border-gray-200 rounded-lg shadow-xl transform -translate-x-1/2 -translate-y-full transition-all"
                    style={{ top: selection.y - 5, left: selection.x }}
                  >
                     <div className="flex p-1 space-x-1">
                        <MenuButton icon={Network} label="Branch Out" onClick={() => handleBranchOut('Manager')} activeColor="text-indigo-600" />
                        <div className="w-px bg-gray-200 mx-1 my-1"></div>
                        <MenuButton 
                          icon={MessageSquare} 
                          label={`Ask ${activeAgent === 'Manager' ? 'AI' : activeAgent}`} 
                          onClick={() => handleBranchOut(activeAgent)} 
                        />
                     </div>
                     <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-gray-200 rotate-45"></div>
                  </div>
                )}
             </div>
          )}

        </div>
      )}

      {/* 3. Main Chat Interface (Center/Right) */}
      <div className="flex-1 flex flex-col relative bg-white min-w-0 border-l border-gray-200 shadow-[-5px_0_15px_-5px_rgba(0,0,0,0.05)]">
        
        {/* Chat Header */}
        <div className="h-14 flex items-center justify-between px-6 border-b border-gray-50">
           <div className="flex items-center space-x-2">
              <span className="text-lg font-semibold text-gray-800">ThinkFlow Chat</span>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full tracking-wide">LIVE</span>
           </div>
           
           {/* Agent Selector Pill */}
           <div className="flex bg-gray-100 p-1 rounded-lg">
              {(['Manager', 'Socrates', 'Feynman', 'Pareto', 'Elon'] as AgentType[]).map((agent) => (
                 <button
                   key={agent}
                   onClick={() => setActiveAgent(agent)}
                   className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeAgent === agent ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                 >
                   {agent}
                 </button>
              ))}
           </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 pb-32 bg-white">
           <div className="max-w-3xl mx-auto space-y-8">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                const agentConfig = msg.agent ? AGENTS_CONFIG[msg.agent] : AGENTS_CONFIG.Manager;
                
                return (
                  <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                    <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
                       
                       {!isUser && (
                         <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm ${agentConfig.color}`}>
                              <Brain className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-sm font-bold text-gray-800">{agentConfig.label}</span>
                         </div>
                       )}

                       {/* Thought Log Display */}
                       {!isUser && msg.thoughtLog && msg.thoughtLog.length > 0 && (
                          <ThoughtLog logs={msg.thoughtLog} />
                       )}

                       <div className={`
                         relative px-5 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm
                         ${isUser 
                           ? 'bg-gray-100 text-gray-900 rounded-br-none' 
                           : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                         }
                       `}>
                         <div className="whitespace-pre-wrap markdown-body">
                            {msg.content}
                            {msg.isStreaming && !msg.content && (
                               <span className="inline-flex space-x-1 items-center h-4">
                                 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                                 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                                 <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                               </span>
                            )}
                         </div>
                       </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
           </div>
        </div>

        {/* Input Area (Fixed Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pt-10">
           <div className="max-w-3xl mx-auto">
              
              {/* Quick Prompts */}
              {messages.length < 3 && (
                <div className="flex justify-center space-x-2 mb-4">
                   <HintPill text="Help me plan a project" icon={Target} onClick={() => handleSendMessage("Help me plan a project")} />
                   <HintPill text="Explain this concept" icon={Lightbulb} onClick={() => handleSendMessage("Explain this concept simply")} />
                   <HintPill text="Analyze my notes" icon={Search} onClick={() => handleSendMessage("Analyze the notes I have so far")} />
                </div>
              )}

              <div className="relative bg-white border border-gray-300 rounded-2xl shadow-lg focus-within:shadow-xl focus-within:border-indigo-500 transition-all">
                <textarea
                  ref={inputRef}
                  className="w-full bg-transparent border-none focus:ring-0 resize-none py-4 pl-4 pr-12 max-h-48 text-base text-gray-800 placeholder-gray-400"
                  placeholder={`Ask ${activeAgent}...`}
                  rows={1}
                  value={inputVal}
                  onChange={(e) => {
                     setInputVal(e.target.value);
                     e.target.style.height = 'auto';
                     e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  className={`absolute right-3 bottom-3 p-2 rounded-xl transition-all duration-200 ${inputVal.trim() && !isThinking ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}
                  onClick={() => handleSendMessage()}
                  disabled={!inputVal.trim() || isThinking}
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-3 text-xs text-gray-400">
                 Gemini can make mistakes. Review generated notes.
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('tf_current_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (loggedInUser: UserType) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('tf_current_user');
    setUser(null);
  };

  if (!user) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return <Workspace user={user} onLogout={handleLogout} />;
};

export default App;
