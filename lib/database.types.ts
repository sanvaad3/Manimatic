export interface Database {
  public: {
    Tables: {
      chats: {
        Row: {
          id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          content: string
          type: 'user' | 'assistant'
          animation_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          content: string
          type: 'user' | 'assistant'
          animation_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          content?: string
          type?: 'user' | 'assistant'
          animation_url?: string | null
          created_at?: string
        }
      }
    }
  }
}