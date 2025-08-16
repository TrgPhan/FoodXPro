// Chat types
export interface ChatRequest {
  session_id: string
  message: string
}

export interface ChatResponse {
  response: string
}

export interface ChatError {
  detail: string
}

import { authenticatedRequest } from './auth'

// API base URL from environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

/**
 * Send a chat message to the AI assistant
 */
export const sendChatMessage = async (request: ChatRequest): Promise<string> => {
  try {
    const data = await authenticatedRequest<ChatResponse>(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      body: JSON.stringify(request)
    })
    return data.response
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Chat request failed')
  }
}

// Only /api/chat endpoint is available
// All other chat functions removed as requested
