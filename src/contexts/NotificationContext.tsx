import React, { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
  duration?: number
}

interface NotificationProps {
  notification: Notification
  onRemove: (id: string) => void
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Анимация появления
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Автоматическое удаление
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onRemove(notification.id), 300) // Ждем завершения анимации
      }, notification.duration || 3000)
      return () => clearTimeout(timer)
    }
  }, [notification.duration, notification.id, onRemove])

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-400" />
    }
  }

  const getBorderColor = () => {
    switch (notification.type) {
      case 'success':
        return 'border-green-400'
      case 'error':
        return 'border-red-400'
      case 'warning':
        return 'border-yellow-400'
      case 'info':
      default:
        return 'border-blue-400'
    }
  }

  return (
    <div
      className={`fixed top-4 right-4 z-50 bg-gray-900 border-l-4 ${getBorderColor()} rounded-lg shadow-lg p-4 min-w-80 max-w-96 transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="flex items-start space-x-3">
        {getIcon()}
        <div className="flex-1">
          <h4 className="text-white font-semibold text-sm">{notification.title}</h4>
          {notification.message && (
            <p className="text-gray-300 text-xs mt-1">{notification.message}</p>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(() => onRemove(notification.id), 300)
          }}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <XCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// Контекст для уведомлений
interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
}

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined)

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = { ...notification, id }
    setNotifications(prev => [...prev, newNotification])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
      {/* Контейнер для уведомлений */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onRemove={removeNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}
