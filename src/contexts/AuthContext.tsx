import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

// Типы для аутентификации
interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: any | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    console.log('Auth: Initializing auth context...')
    
    // Получаем текущую сессию
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return
      
      if (error) {
        console.error('Auth: Error getting session:', error)
        setLoading(false)
        return
      }
      
      console.log('Auth: Session retrieved:', session?.user?.id)
      setSession(session)
      if (session?.user) {
        fetchUserProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    }).catch((error) => {
      console.error('Auth: Error getting session:', error)
      if (isMounted) {
        setLoading(false)
      }
    })

    // Слушаем изменения аутентификации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('Auth: Auth state changed:', event, session?.user?.id)
      setSession(session)
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const fetchUserProfile = async (supabaseUser: any) => {
    try {
      console.log('Auth: Fetching profile for user:', supabaseUser.id)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      if (error) {
        console.error('Auth: Error fetching user profile:', error)
        
        // Если пользователь не найден в таблице users, создаем его
        if (error.code === 'PGRST116') {
          console.log('Auth: User not found, creating profile...')
          
          // Создаем пользователя напрямую из данных Supabase Auth
          const userData = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Пользователь',
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          console.log('Auth: Creating user with data:', userData)
          setUser(userData)
          setLoading(false)
          return
        } else {
          console.error('Auth: Unexpected error:', error)
          setLoading(false)
          return
        }
      } else {
        console.log('Auth: User profile found:', data)
        setUser(data)
      }
    } catch (error) {
      console.error('Auth: Error in fetchUserProfile:', error)
      
      // В случае любой ошибки, создаем пользователя из данных Supabase Auth
      console.log('Auth: Creating fallback user profile...')
      const fallbackUser = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Пользователь',
        avatar_url: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setUser(fallbackUser)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) throw error

    if (data.user) {
      // Создаем профиль пользователя
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: data.user.id,
            email: data.user.email!,
            full_name: fullName,
            avatar_url: undefined,
          },
        ])

      if (profileError) throw profileError
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in')

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error

    // Обновляем локальное состояние
    setUser({ ...user, ...updates })
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}