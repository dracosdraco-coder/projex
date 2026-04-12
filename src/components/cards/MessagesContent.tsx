'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { MessageSquare, Send, Paperclip, X, File, Download, Search, ArrowLeft, Plus, Users, Hash, Bell, ChevronDown } from 'lucide-react'

interface Message { id: string; projectId?: string; branchId?: string; senderName: string; content: string; attachments: MessageAttachment[]; createdAt: string }
interface MessageAttachment { id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number }
interface Project { id: string; name: string; client?: string }
interface Branch { id: string; name: string }
interface Notification { id: string; type: string; title: string; body: string; read: boolean; createdAt: string; projectId?: string }

interface MessagesContentProps {
  messages: Message[]
  projects: Project[]
  branches: Branch[]
  notifications?: Notification[]
  teamMembers?: { id: string; name: string }[]
  onCreateMessage: (data: { projectId?: string; branchId?: string; content: string }) => Promise<any>
  onDeleteMessage: (id: string) => Promise<void>
  onUploadAttachment: (messageId: string, file: File) => Promise<void>
  onRefresh?: () => Promise<void>
}

export default function MessagesContent({
  messages, projects, branches, notifications = [], teamMembers = [],
  onCreateMessage, onDeleteMessage, onUploadAttachment,
}: MessagesContentProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [showNewChat, setShowNewChat] = useState(false)
  const [showChatMembers, setShowChatMembers] = useState(false)
  const [sending, setSending] = useState(false)
  const [customChats, setCustomChats] = useState<{ id: string; name: string; members: string[] }[]>([])
  const [newChatName, setNewChatName] = useState('')
  const [newChatMembers, setNewChatMembers] = useState<string[]>([])
  const [showCustomForm, setShowCustomForm] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedChat, messages.length])

  // Activity log from notifications
  const activityLog = useMemo(() =>
    notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100),
    [notifications]
  )

  // Build chat list
  const allChats = useMemo(() => {
    const selfChat = {
      id: 'activity-log',
      name: '🔔 Activity Log',
      subtitle: 'All your app activity',
      lastMessage: activityLog[0]?.title || 'No activity yet',
      lastTime: activityLog[0]?.createdAt || '',
      unread: activityLog.filter(n => !n.read).length,
      isSpecial: true,
    }

    const projectChats = projects.map(p => {
      const msgs = messages.filter(m => m.projectId === p.id)
      const last = msgs[0]
      return {
        id: p.id, name: p.name, subtitle: p.client || 'Project',
        lastMessage: last?.content || 'No messages', lastTime: last?.createdAt || '',
        unread: 0, isSpecial: false,
      }
    })

    const branchChats = branches.map(b => {
      const msgs = messages.filter(m => m.branchId === b.id)
      const last = msgs[0]
      return {
        id: b.id, name: b.name, subtitle: 'Branch',
        lastMessage: last?.content || 'No messages', lastTime: last?.createdAt || '',
        unread: 0, isSpecial: false,
      }
    })

    const custom = customChats.map(c => {
      const msgs = messages.filter(m => m.projectId === c.id)
      const last = msgs[0]
      return {
        id: c.id, name: c.name, subtitle: `${c.members.length} members`,
        lastMessage: last?.content || 'No messages', lastTime: last?.createdAt || '',
        unread: 0, isSpecial: false,
      }
    })

    return [selfChat, ...custom, ...projectChats, ...branchChats]
  }, [projects, branches, messages, notifications, customChats, activityLog])

  const filteredChats = searchQuery
    ? allChats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allChats

  const currentChat = allChats.find(c => c.id === selectedChat)
  const currentMessages = selectedChat === 'activity-log'
    ? [] // handled separately
    : messages.filter(m => m.projectId === selectedChat || m.branchId === selectedChat)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChat || selectedChat === 'activity-log' || sending) return
    setSending(true)
    try {
      const isProject = projects.some(p => p.id === selectedChat)
      const isCustom = customChats.some(c => c.id === selectedChat)
      const msg = await onCreateMessage({
        projectId: isProject || isCustom ? selectedChat : undefined,
        branchId: !isProject && !isCustom ? selectedChat : undefined,
        content: newMessage.trim(),
      })
      if (selectedFiles.length > 0 && msg) {
        for (const file of selectedFiles) await onUploadAttachment(msg.id, file)
      }
      setNewMessage('')
      setSelectedFiles([])
      inputRef.current?.focus()
    } catch (e) {}
    setSending(false)
  }

  const createCustomChat = () => {
    if (!newChatName.trim()) return
    const id = `custom-${Date.now()}`
    setCustomChats(prev => [...prev, { id, name: newChatName, members: newChatMembers }])
    setSelectedChat(id)
    setShowCustomForm(false)
    setShowNewChat(false)
    setNewChatName('')
    setNewChatMembers([])
  }

  const formatTime = (date: string) => {
    if (!date) return ''
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''
    const now = new Date()
    if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1)
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  const activityIcon = (type: string) => {
    switch (type) {
      case 'message': return '💬'
      case 'task': return '✅'
      case 'document': return '📄'
      case 'project': return '📁'
      default: return '🔔'
    }
  }

  return (
    <div className="h-full flex bg-gray-50 dark:bg-[#111]">
      {/* Sidebar */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 bg-white dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-[#2a2a2a]`}>
        <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Messages</h2>
            <button onClick={() => setShowNewChat(true)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(chat => (
            <button key={chat.id} onClick={() => setSelectedChat(chat.id)}
              className={`w-full px-4 py-3 border-b border-gray-100 dark:border-[#2a2a2a]/50 text-left transition-colors hover:bg-gray-50 dark:hover:bg-[#252525]/50 ${
                selectedChat === chat.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''} ${chat.isSpecial ? 'bg-gradient-to-r from-amber-50/50 to-transparent dark:from-amber-900/10' : ''}`}>
              <div className="flex items-start justify-between mb-0.5">
                <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate flex-1">{chat.name}</h3>
                <span className="text-[10px] text-gray-400 ml-2 whitespace-nowrap">{formatTime(chat.lastTime)}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] text-gray-400">{chat.subtitle}</span>
                {chat.unread > 0 && <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded-full font-medium">{chat.unread}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-white dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#2a2a2a] px-4 py-3 flex items-center gap-3">
            <button onClick={() => setSelectedChat(null)} className="md:hidden p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{currentChat?.name}</h3>
              <p className="text-[10px] text-gray-500">{currentChat?.subtitle}</p>
            </div>
            {selectedChat !== 'activity-log' && (
              <button onClick={() => setShowChatMembers(true)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg">
                <Users className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Messages / Activity Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedChat === 'activity-log' ? (
              activityLog.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No activity yet</p>
                  <p className="text-xs">Actions you take in Projex will appear here</p>
                </div>
              ) : (
                activityLog.map(n => (
                  <div key={n.id} className={`flex gap-3 p-3 rounded-xl transition-colors ${n.read ? 'bg-white dark:bg-[#1e1e1e]' : 'bg-blue-50 dark:bg-blue-900/10'} border border-gray-100 dark:border-[#2a2a2a]`}>
                    <span className="text-lg">{activityIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                      {n.body && <p className="text-xs text-gray-500 mt-0.5 truncate">{n.body}</p>}
                      <p className="text-[10px] text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                    </div>
                  </div>
                ))
              )
            ) : (
              <>
                {currentMessages.length === 0 && (
                  <div className="text-center py-16 text-gray-400">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium">No messages yet</p>
                    <p className="text-xs">Send a message to start the conversation</p>
                  </div>
                )}
                {currentMessages.map(msg => (
                  <div key={msg.id} className="group">
                    <div className="bg-white dark:bg-[#1e1e1e] rounded-xl border border-gray-100 dark:border-[#2a2a2a] p-3.5 max-w-2xl hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {msg.senderName?.[0]?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium text-xs text-gray-900 dark:text-gray-100">{msg.senderName}</span>
                          <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                        </div>
                        <button onClick={() => onDeleteMessage(msg.id)}
                          className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all rounded">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      {msg.attachments?.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {msg.attachments.map(att => (
                            <div key={att.id}>
                              {att.fileType?.startsWith('image/') ? (
                                <img src={att.fileUrl} alt={att.fileName} className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 border" onClick={() => setPreviewImage(att.fileUrl)} />
                              ) : (
                                <a href={att.fileUrl} download={att.fileName} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-[#222] rounded-lg hover:bg-gray-100 dark:hover:bg-[#2a2a2a] text-xs max-w-xs">
                                  <File className="w-4 h-4 text-gray-500" /><span className="flex-1 truncate">{att.fileName}</span>
                                  <span className="text-gray-400">{formatFileSize(att.fileSize)}</span><Download className="w-3.5 h-3.5 text-gray-400" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input — hidden for activity log */}
          {selectedChat !== 'activity-log' && (
            <div className="bg-white dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#2a2a2a] p-3">
              {selectedFiles.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 dark:bg-[#222] rounded-lg text-xs">
                      <span className="truncate max-w-[120px]">{file.name}</span>
                      <button onClick={() => setSelectedFiles(f => f.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-end gap-2">
                <label className="cursor-pointer p-2 hover:bg-gray-100 dark:hover:bg-[#252525] rounded-lg flex-shrink-0">
                  <Paperclip className="w-4 h-4 text-gray-500" />
                  <input type="file" multiple className="hidden" onChange={e => { if (e.target.files) setSelectedFiles(prev => [...prev, ...Array.from(e.target.files!)]) }} />
                </label>
                <textarea ref={inputRef} value={newMessage} onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Type a message..." rows={1}
                  className="flex-1 px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 max-h-24" />
                <button onClick={handleSend} disabled={!newMessage.trim() || sending}
                  className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center text-gray-400">
            <MessageSquare className="w-14 h-14 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">Select a conversation</p>
            <p className="text-xs mt-1">or start a new one</p>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setShowNewChat(false); setShowCustomForm(false) }} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-[#2a2a2a] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Chat</h3>
              <button onClick={() => { setShowNewChat(false); setShowCustomForm(false) }} className="p-1 text-gray-400 hover:text-gray-600 rounded"><X className="w-5 h-5" /></button>
            </div>

            {!showCustomForm ? (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Custom chat button */}
                <button onClick={() => setShowCustomForm(true)}
                  className="w-full text-left p-3 border-2 border-dashed border-gray-200 dark:border-[#333] rounded-xl hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"><Hash className="w-4 h-4 text-white" /></div>
                    <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">Create Custom Chat</p><p className="text-[10px] text-gray-500">Add members and name your group</p></div>
                  </div>
                </button>

                {projects.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Projects</p>
                    <div className="space-y-1">
                      {projects.map(p => (
                        <button key={p.id} onClick={() => { setSelectedChat(p.id); setShowNewChat(false) }}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{p.name}</p>
                          {p.client && <p className="text-[10px] text-gray-500">{p.client}</p>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {branches.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Branches</p>
                    <div className="space-y-1">
                      {branches.map(b => (
                        <button key={b.id} onClick={() => { setSelectedChat(b.id); setShowNewChat(false) }}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{b.name}</p>
                          <p className="text-[10px] text-gray-500">Branch</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Chat Name *</label>
                  <input type="text" value={newChatName} onChange={e => setNewChatName(e.target.value)} placeholder="e.g. Site Coordination"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Add Members</label>
                  <div className="space-y-1.5">
                    {teamMembers.map(m => (
                      <label key={m.id} className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer border transition-all ${
                        newChatMembers.includes(m.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-[#333] hover:bg-gray-50 dark:hover:bg-[#222]'}`}>
                        <input type="checkbox" checked={newChatMembers.includes(m.id)}
                          onChange={e => setNewChatMembers(prev => e.target.checked ? [...prev, m.id] : prev.filter(id => id !== m.id))} className="accent-blue-600 rounded" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">{m.name}</span>
                      </label>
                    ))}
                    {teamMembers.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No team members to add</p>}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowCustomForm(false)} className="flex-1 px-4 py-2 text-sm border border-gray-200 dark:border-[#333] rounded-lg">Back</button>
                  <button onClick={createCustomChat} disabled={!newChatName.trim()} className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">Create Chat</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Members */}
      {showChatMembers && selectedChat && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowChatMembers(false)} />
          <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-gray-200 dark:border-[#2a2a2a] relative">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Chat Members</h3>
            <p className="text-xs text-gray-500 mb-4">{currentChat?.name}</p>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {teamMembers.length > 0 ? teamMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-[#222]">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold">{m.name[0]}</div>
                  <span className="text-sm text-gray-900 dark:text-gray-100">{m.name}</span>
                </div>
              )) : <p className="text-xs text-gray-400 text-center py-4">No team members</p>}
            </div>
            <button onClick={() => setShowChatMembers(false)} className="w-full px-4 py-2 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg">Done</button>
          </div>
        </div>
      )}

      {/* Image Preview */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[500] cursor-pointer" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-w-4xl max-h-[90vh] rounded-lg" />
        </div>
      )}
    </div>
  )
}
