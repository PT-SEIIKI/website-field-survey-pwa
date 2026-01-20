// RBAC enabled auth utility
const SESSION_KEY = "surveyUserLogin"

export interface User {
  id: number
  username: string
  role: "admin" | "user"
  createdAt: string
  expiresAt?: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export async function login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (response.ok) {
      const user = await response.json();
      // Create session with expiry (24 hours)
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      const sessionUser = { ...user, expiresAt: expiry };
      
      localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
      
      // Trigger sync immediately on login to fetch data from server
      import("./sync-manager").then(m => m.startSync()).catch(console.error);

      return { success: true, user: sessionUser };
    } else {
      const errorData = await response.json();
      return { success: false, error: errorData.message || "Username atau password salah" };
    }
  } catch (err) {
    return { success: false, error: "Terjadi kesalahan koneksi" };
  }
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
    const session = JSON.parse(sessionJson)
    
    // Check expiry
    if (session.expiresAt && Date.now() > session.expiresAt) {
      logout()
      return null
    }
    
    return session
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

export function hasRole(role: "admin" | "user"): boolean {
  const user = getCurrentUser()
  return user?.role === role
}
