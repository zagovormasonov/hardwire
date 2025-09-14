import React, { createContext, useContext, useState, useEffect } from 'react'
import { message } from 'antd'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

interface MessageNotification {
  id: string
  sender_id: string
  receiver_id: string
  message_text: string
  created_at: string
  sender_name?: string
}

interface MessageNotificationContextType {
  notifications: MessageNotification[]
  addNotification: (notification: MessageNotification) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

const MessageNotificationContext = createContext<MessageNotificationContextType | undefined>(undefined)

export const MessageNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState<MessageNotification[]>([])

  // Периодически проверяем новые сообщения
  useEffect(() => {
    if (!user) return

    console.log('MessageNotification: Запускаем проверку новых сообщений для пользователя:', user.id)
    
    const checkNewMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!messages_sender_id_fkey(name, avatar_url)
          `)
          .eq('receiver_id', user.id)
          .eq('is_read', false)
          .order('created_at', { ascending: false })
          .limit(10)

        if (error) {
          console.error('MessageNotification: Ошибка проверки сообщений:', error)
          return
        }

        if (data && data.length > 0) {
          console.log('MessageNotification: Найдено новых сообщений:', data.length)
          
          const newNotifications = data.map(msg => ({
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            message_text: msg.message_text,
            created_at: msg.created_at,
            sender_name: (msg.sender as any)?.name
          }))

          // Добавляем только новые уведомления
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id))
            const newOnes = newNotifications.filter(n => !existingIds.has(n.id))
            
            if (newOnes.length > 0) {
              console.log('MessageNotification: Добавляем новые уведомления:', newOnes.length)
              
              // Показываем уведомление пользователю
              newOnes.forEach(notification => {
                message.info({
                  content: `Новое сообщение от ${notification.sender_name}: ${notification.message_text.substring(0, 50)}${notification.message_text.length > 50 ? '...' : ''}`,
                  duration: 5,
                  style: {
                    marginTop: '20px',
                  },
                })
              })
              
              return [...newOnes, ...prev]
            }
            return prev
          })
        }
      } catch (error) {
        console.error('MessageNotification: Ошибка при проверке сообщений:', error)
      }
    }

    // Проверяем каждые 3 секунды
    const interval = setInterval(checkNewMessages, 3000)
    
    // Также проверяем сразу при запуске
    checkNewMessages()

    return () => {
      console.log('MessageNotification: Останавливаем проверку сообщений')
      clearInterval(interval)
    }
  }, [user])

  const addNotification = (notification: MessageNotification) => {
    setNotifications(prev => [notification, ...prev])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearNotifications = () => {
    setNotifications([])
  }

  return (
    <MessageNotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearNotifications
    }}>
      {children}
    </MessageNotificationContext.Provider>
  )
}

export const useMessageNotifications = () => {
  const context = useContext(MessageNotificationContext)
  if (context === undefined) {
    throw new Error('useMessageNotifications must be used within a MessageNotificationProvider')
  }
  return context
}
