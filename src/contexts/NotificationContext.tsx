import React, { createContext, useContext } from 'react'
import { notification } from 'antd'

export interface Notification {
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

interface NotificationContextType {
  addNotification: (notification: Notification) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addNotification = (notif: Notification) => {
    const config = {
      message: notif.title,
      description: notif.message,
      duration: notif.duration || 3,
      style: {
        background: '#1a1a1a',
        border: '1px solid #374151',
        borderRadius: '8px',
      },
    }

    switch (notif.type) {
      case 'success':
        notification.success(config)
        break
      case 'error':
        notification.error(config)
        break
      case 'warning':
        notification.warning(config)
        break
      case 'info':
      default:
        notification.info(config)
        break
    }
  }

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
