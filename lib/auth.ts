// Simple auth utility (production harus lebih secure)
const USERS_KEY = "survey_users"
const SESSION_KEY = "surveyUserLogin"

export interface User {
  id: string
  username: string
  email: string
  role: "surveyor" | "admin"
  createdAt: number
}

export interface LoginCredentials {
  username: string
  password: string
}

// Initialize default users
export function initializeDefaultUsers() {
  if (typeof window === "undefined") return

  const existingUsers = localStorage.getItem(USERS_KEY)
  if (!existingUsers) {
    const defaultUsers = [
      {
        id: "user-1",
        username: "surveyor1",
        password: "password123", // Hanya untuk demo - production harus hash!
        email: "surveyor1@example.com",
        role: "surveyor" as const,
        createdAt: Date.now(),
      },
      {
        id: "admin-1",
        username: "admin",
        password: "admin123",
        email: "admin@example.com",
        role: "admin" as const,
        createdAt: Date.now(),
      },
    ]
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
  }
}

export function login(credentials: LoginCredentials): { success: boolean; user?: User; error?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot login on server" }
  }

  const usersJson = localStorage.getItem(USERS_KEY)
  if (!usersJson) {
    initializeDefaultUsers()
    return login(credentials)
  }

  const users = JSON.parse(usersJson)
  const user = users.find((u: any) => u.username === credentials.username && u.password === credentials.password)

  if (!user) {
    return { success: false, error: "Username atau password salah" }
  }

  // Create session
  const sessionUser = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }

  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
  return { success: true, user: sessionUser }
}

export function logout(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null

  const sessionJson = localStorage.getItem(SESSION_KEY)
  if (!sessionJson) return null

  try {
    return JSON.parse(sessionJson)
  } catch {
    return null
  }
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null
}

export function isAdmin(): boolean {
  const user = getCurrentUser()
  return user?.role === "admin"
}
