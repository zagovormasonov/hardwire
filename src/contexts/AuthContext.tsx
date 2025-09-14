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
  signUp: (email: string, password: string, fullName: string) => Promise<{ success: boolean; needsEmailConfirmation: boolean; email: string } | void>
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
    
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!isMounted) return
      
      if (error) {
        setLoading(false)
        return
      }
      
      setSession(session)
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        setUser(null)
        setLoading(false)
      }
    }).catch(() => {
      if (isMounted) {
        setLoading(false)
      }
    })

    // Слушаем изменения аутентификации
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      console.log('AuthContext: Auth state change:', event, session ? 'session exists' : 'no session')
      
      setSession(session)
      if (session?.user) {
        await fetchUserProfile(session.user)
      } else {
        console.log('AuthContext: Очищаем состояние пользователя')
        setUser(null)
        setLoading(false)
      }
    })

    // Дополнительная защита от зависания
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false)
      }
    }, 3000)
    
    return () => {
      isMounted = false
      subscription.unsubscribe()
      clearTimeout(safetyTimeout)
    }
  }, [])

  const fetchUserProfile = async (supabaseUser: any) => {
    
    // Создаем таймаут для запроса
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database request timeout')), 3000)
    )
    
    try {
      
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      // Используем Promise.race для таймаута
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any

      if (error) {
        
        // Если пользователь не найден в таблице users, создаем его
        if (error.code === 'PGRST116') {
          
          // Создаем пользователя напрямую из данных Supabase Auth
          const userData = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Пользователь',
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          setUser(userData)
          setLoading(false)
          return
        } else {
          // Fallback к локальному профилю
          const fallbackUser = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Пользователь',
            avatar_url: undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          setUser(fallbackUser)
          setLoading(false)
          return
        }
      } else {
        setUser(data)
        setLoading(false)
      }
    } catch (error: any) {
      
      // В случае любой ошибки (включая таймаут), создаем пользователя из данных Supabase Auth
      const fallbackUser = {
        id: supabaseUser.id,
        email: supabaseUser.email,
        full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0] || 'Пользователь',
        avatar_url: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setUser(fallbackUser)
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    console.log('AuthContext: Начинаем регистрацию пользователя:', email)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      console.error('AuthContext: Ошибка регистрации:', error)
      throw error
    }

    console.log('AuthContext: Регистрация успешна, создаем профиль')

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

      if (profileError) {
        console.error('AuthContext: Ошибка создания профиля:', profileError)
        throw profileError
      }

      console.log('AuthContext: Профиль создан, регистрация завершена')
      
      // Возвращаем информацию о том, что нужно подтвердить email
      return {
        success: true,
        needsEmailConfirmation: true,
        email: data.user.email || email
      }
    }
    
    // Если что-то пошло не так, возвращаем базовый результат
    return {
      success: true,
      needsEmailConfirmation: true,
      email: email
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
    console.log('AuthContext: Начинаем выход из системы')
    
    // Сразу очищаем состояние, чтобы избежать зависания
    setUser(null)
    setSession(null)
    setLoading(false)
    
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('AuthContext: Ошибка Supabase signOut:', error)
        // Не выбрасываем ошибку, так как состояние уже очищено
        return
      }
      
      console.log('AuthContext: Выход успешен')
    } catch (error) {
      console.error('AuthContext: Ошибка при выходе:', error)
      // Не выбрасываем ошибку, так как состояние уже очищено
    }
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