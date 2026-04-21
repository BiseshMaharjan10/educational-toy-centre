export interface MessageReply {
  id: string
  messageId: string
  senderRole: 'USER' | 'ADMIN'
  body: string
  createdAt: string
}

export interface Message {
  id: string
  userId: string
  subject: string
  body: string
  isRead: boolean
  isResolved: boolean
  createdAt: string
  replies: MessageReply[]
  user?: {
    name: string
    email: string
  }
}