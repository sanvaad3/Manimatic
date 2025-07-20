"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Message {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  chat_id: string
  animation_url?: string
}

export interface Chat {
  id: string
  title: string
  created_at: Date
  updated_at: Date
}

interface ChatStore {
  chats: Chat[]
  messages: Message[]
  currentChatId: string | null
  sidebarWidth: number
  
  // Chat actions
  createChat: (title?: string) => string
  setCurrentChat: (chatId: string | null) => void
  deleteChat: (chatId: string) => void
  updateChatTitle: (chatId: string, title: string) => void
  loadChats: () => void
  
  // Message actions
  addMessage: (chatId: string, content: string, role: 'user' | 'assistant', animationUrl?: string) => void
  loadMessages: (chatId: string) => void
  
  // UI state
  setSidebarWidth: (width: number) => void
}

export const useLocalChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [],
      messages: [],
      currentChatId: null,
      sidebarWidth: 300,
      
      createChat: (title = "New Chat") => {
        const chatId = `chat_${Date.now()}`
        const newChat: Chat = {
          id: chatId,
          title,
          created_at: new Date(),
          updated_at: new Date(),
        }
        
        set(state => ({
          chats: [newChat, ...state.chats],
          currentChatId: chatId,
        }))
        
        return chatId
      },
      
      setCurrentChat: (chatId) => {
        set({ currentChatId: chatId })
        if (chatId) {
          get().loadMessages(chatId)
        }
      },
      
      deleteChat: (chatId) => {
        set(state => ({
          chats: state.chats.filter(chat => chat.id !== chatId),
          messages: state.messages.filter(msg => msg.chat_id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
        }))
      },
      
      updateChatTitle: (chatId, title) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, title, updated_at: new Date() }
              : chat
          ),
        }))
      },
      
      loadChats: () => {
        // Chats are automatically loaded from persistence
      },
      
      addMessage: (chatId, content, role, animationUrl) => {
        const message: Message = {
          id: `msg_${Date.now()}_${Math.random()}`,
          content,
          role,
          timestamp: new Date(),
          chat_id: chatId,
          animation_url: animationUrl,
        }
        
        set(state => ({
          messages: [...state.messages, message],
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, updated_at: new Date() }
              : chat
          ),
        }))
      },
      
      loadMessages: (chatId) => {
        // Messages are automatically loaded from persistence
        // Filter is done in the component
      },
      
      setSidebarWidth: (width) => {
        set({ sidebarWidth: width })
      },
    }),
    {
      name: "manimatic-chat-store",
    }
  )
)