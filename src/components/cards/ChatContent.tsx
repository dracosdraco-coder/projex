'use client'

import { useState } from 'react'
import { Project, ChatMessage } from '@/types'
import EmptyState from '@/components/ui/EmptyState'

interface ChatContentProps {
  projects: Project[]
  messages: ChatMessage[]
}

export default function ChatContent({ projects = [], messages = [] }: ChatContentProps) {
  const [chatInput, setChatInput] = useState('')

  if (messages.length === 0) {
    return (
      <EmptyState
        icon="chat"
        title="No messages yet"
        description="Start a conversation with your team."
      />
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <select className="px-3 py-1.5 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-lg text-sm text-gray-900 dark:text-gray-100">
          <option>All Projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 overflow-auto mb-4 space-y-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
              msg.sender === 'You' 
                ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-br-md' 
                : 'bg-gray-100 dark:bg-[#222222] text-gray-900 dark:text-gray-100 rounded-bl-md'
            }`}>
              {msg.sender !== 'You' && (
                <p className="text-xs font-medium mb-1 opacity-70">{msg.sender}</p>
              )}
              <p className="text-sm">{msg.message}</p>
              <p className={`text-xs mt-1 ${msg.sender === 'You' ? 'text-gray-400 dark:text-gray-600' : 'text-gray-500 dark:text-gray-400'}`}>
                {msg.timestamp}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder="Type a message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-50 dark:bg-[#222222] border border-gray-200 dark:border-[#333333] rounded-full text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-[#444444]"
        />
        <button className="p-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
