// Authentication types
export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  password: string
  email: string
  full_name: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
}

export interface RegisterResponse {
  status: string
  message: string
}

export interface ChangePasswordRequest {
  password: string
}

export interface ChangePasswordResponse {
  success: boolean
  message: string
}

export interface AuthError {
  detail: string
}

// API base URL from environment variable
let API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

// Store token in localStorage
let TOKEN_KEY = 'auth_token'

/**
 * Store authentication token
 */
export let storeToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
  // Emit custom event for auth change
  window.dispatchEvent(new Event('auth-change'))
}

/**
 * Get stored authentication token
 */
export let getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * Remove authentication token
 */
export let removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
  // Emit custom event for auth change
  window.dispatchEvent(new Event('auth-change'))
}

/**
 * Check if user is authenticated
 */
export let isAuthenticated = (): boolean => {
  return getToken() !== null
}

/**
 * Get authorization header for API requests
 */
export let getAuthHeader = (): { Authorization: string } | {} => {
  let token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Register new user
 */
export let register = async (userData: RegisterRequest): Promise<RegisterResponse> => {
  try {
    let response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      let errorData: AuthError = await response.json()
      throw new Error(errorData.detail || 'Đăng ký thất bại')
    }

    let data: RegisterResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Đăng ký thất bại')
  }
}

/**
 * Login user
 */
export let login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  try {
    // FastAPI OAuth2PasswordRequestForm expects form data, not JSON
    let formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)

    let response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      let errorData: AuthError = await response.json()
      throw new Error(errorData.detail || 'Đăng nhập thất bại')
    }

    let data: LoginResponse = await response.json()
    
    // Store the access_token from response
    storeToken(data.access_token)
    
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Đăng nhập thất bại')
  }
}

/**
 * Change password
 */
export let changePassword = async (passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
  try {
    const data = await authenticatedRequest<ChangePasswordResponse>(`${API_BASE_URL}/auth/change_password`, {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    })
    
    return data
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message)
    }
    throw new Error('Đổi mật khẩu thất bại')
  }
}

/**
 * Logout user
 */
export let logout = (): void => {
  removeToken()
  
  // Clear app cache on logout
  try {
    let { clearAppCache } = require('./cache')
    clearAppCache()
  } catch (error) {
    console.warn('Failed to clear cache:', error)
  }
}

/**
 * Make authenticated API request helper
 */
export let authenticatedRequest = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<T> => {
  let token = getToken()
  
  if (!token) {
    throw new Error('No authentication token')
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 401) {
    // Token expired or invalid
    logout()
    throw new Error('Authentication expired')
  }

  if (!response.ok) {
    let errorData: AuthError = await response.json()
    throw new Error(errorData.detail || 'Request failed')
  }

  return response.json()
}

// Legacy API compatibility for login/register forms
export let authAPI = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    let response = await login(credentials)
    
    // Pre-load app data after successful login
    try {
      let { preloadAppData } = await import('./cache')
      preloadAppData() // Don't await - run in background
    } catch (error) {
      console.warn('Failed to pre-load app data:', error)
    }
    
    return response
  },
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return register(data)
  },
  changePassword: async (data: ChangePasswordRequest): Promise<ChangePasswordResponse> => {
    return changePassword(data)
  }
}

export let authStorage = {
  setAuth: (response: LoginResponse): void => {
    storeToken(response.access_token)
  }
}
