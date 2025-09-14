import React, { useState, useEffect, useRef } from 'react'
import { Modal, Input, Button, Avatar, Typography, Space, Divider, message, Spin } from 'antd'
import { SendOutlined, UserOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const { TextArea } = Input
const { Text, Title } = Typography

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message_text: string
  created_at: string
  sender_name?: string
  sender_avatar?: string
}

interface ChatWebSocketProps {
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  productTitle?: string
  onClose?: () => void
}

const ChatWebSocket: React.FC<ChatWebSocketProps> = ({ 
  sellerId, 
  sellerName, 
  sellerAvatar, 
  productTitle,
  onClose 
}) => {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  console.log('ChatWebSocket: Компонент рендерится', { sellerId, sellerName, productTitle, userId: user?.id })

  // Подключение к WebSocket серверу
  useEffect(() => {
    if (!user) return

    console.log('ChatWebSocket: Подключаемся к WebSocket серверу')
    
    const wsUrl = `wss://gopfkqwtcvwnkbghvbov.supabase.co/functions/v1/websocket-server`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('ChatWebSocket: WebSocket соединение установлено')
      setWsConnected(true)
      
      // Авторизуемся
      ws.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('ChatWebSocket: Получено сообщение от WebSocket:', data)
        
        if (data.type === 'auth_success') {
          console.log('ChatWebSocket: Авторизация в WebSocket успешна')
        }
        
        if (data.type === 'new_message') {
          console.log('ChatWebSocket: Получено новое сообщение:', data.message)
          
          // Получаем информацию об отправителе
          const getSenderInfo = async () => {
            const { data: senderData } = await supabase
              .from('users')
              .select('name, avatar_url')
              .eq('id', data.message.sender_id)
              .single()

            const newMessage: Message = {
              ...data.message,
              sender_name: senderData?.name,
              sender_avatar: senderData?.avatar_url
            }

            setMessages(prev => [...prev, newMessage])
            
            // Прокручиваем к последнему сообщению
            setTimeout(() => {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }, 100)
          }
          
          getSenderInfo()
        }
        
        if (data.type === 'message_sent') {
          console.log('ChatWebSocket: Сообщение успешно отправлено:', data.messageId)
        }
        
        if (data.type === 'error') {
          console.error('ChatWebSocket: Ошибка WebSocket:', data.message)
          message.error(data.message)
        }
        
      } catch (error) {
        console.error('ChatWebSocket: Ошибка обработки WebSocket сообщения:', error)
      }
    }

    ws.onclose = () => {
      console.log('ChatWebSocket: WebSocket соединение закрыто')
      setWsConnected(false)
      
      // Переподключаемся через 3 секунды
      setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.CLOSED) {
          console.log('ChatWebSocket: Переподключаемся к WebSocket')
          // Переподключение будет выполнено в useEffect
        }
      }, 3000)
    }

    ws.onerror = (error) => {
      console.error('ChatWebSocket: Ошибка WebSocket:', error)
      setWsConnected(false)
    }

    return () => {
      console.log('ChatWebSocket: Закрываем WebSocket соединение')
      ws.close()
    }
  }, [user])

  // Загружаем историю сообщений
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return

      try {
        console.log('ChatWebSocket: Загружаем историю сообщений')
        
        // Используем HTTP API для загрузки сообщений
        const response = await fetch(
          `https://gopfkqwtcvwnkbghvbov.supabase.co/functions/v1/websocket-server/messages?userId=${user.id}&otherUserId=${sellerId}`,
          {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'apikey': process.env.REACT_APP_SUPABASE_ANON_KEY || ''
            }
          }
        )
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages')
        }
        
        const data = await response.json()
        console.log('ChatWebSocket: Загружено сообщений:', data.messages?.length)
        
        const formattedMessages = data.messages?.map((msg: any) => ({
          ...msg,
          sender_name: (msg.sender as any)?.name,
          sender_avatar: (msg.sender as any)?.avatar_url
        })) || []
        
        setMessages(formattedMessages)
      } catch (error) {
        console.error('ChatWebSocket: Ошибка при загрузке сообщений:', error)
        message.error('Не удалось загрузить сообщения')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [user, sellerId])

  // Прокручиваем к последнему сообщению при загрузке
  useEffect(() => {
    if (!loading && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [loading, messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !wsRef.current) return

    setSending(true)
    try {
      console.log('ChatWebSocket: Отправляем сообщение через WebSocket:', newMessage)
      
      // Отправляем через WebSocket
      wsRef.current.send(JSON.stringify({
        type: 'message',
        senderId: user.id,
        receiverId: sellerId,
        messageText: newMessage.trim()
      }))
      
      // Добавляем сообщение в локальное состояние сразу
      const newMessageObj: Message = {
        id: `temp-${Date.now()}`,
        sender_id: user.id,
        receiver_id: sellerId,
        message_text: newMessage.trim(),
        created_at: new Date().toISOString(),
        sender_name: user.full_name || 'Пользователь',
        sender_avatar: user.avatar_url
      }
      
      setMessages(prev => [...prev, newMessageObj])
      setNewMessage('')
      
      // Прокручиваем к последнему сообщению
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      
    } catch (error) {
      console.error('ChatWebSocket: Ошибка при отправке сообщения:', error)
      message.error('Произошла ошибка при отправке сообщения')
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'только что'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Modal
        open={true}
        onCancel={onClose}
        footer={null}
        width={800}
        centered
        styles={{
          content: { 
            background: '#1a1a1a', 
            border: '1px solid #374151', 
            borderRadius: '12px',
            padding: 0
          },
          mask: { backdropFilter: 'blur(5px)' },
        }}
      >
        <div style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Spin size="large" />
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title={
        <Space>
          <Avatar src={sellerAvatar} icon={<UserOutlined />} />
          <div>
            <Title level={5} style={{ margin: 0, color: '#ffffff' }}>
              {sellerName}
              {wsConnected && <span style={{ color: '#00ff88', marginLeft: '8px' }}>●</span>}
            </Title>
            {productTitle && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                по товару "{productTitle}"
              </Text>
            )}
          </div>
        </Space>
      }
      open={true}
      onCancel={onClose}
      footer={null}
      width={800}
      centered
      styles={{
        content: { 
          background: '#1a1a1a', 
          border: '1px solid #374151', 
          borderRadius: '12px',
          padding: 0
        },
        header: { 
          background: '#1a1a1a', 
          borderBottom: '1px solid #374151',
          padding: '16px 24px'
        },
        mask: { backdropFilter: 'blur(5px)' },
      }}
    >
      {/* Область сообщений */}
      <div 
        style={{ 
          height: '400px',
          overflowY: 'auto', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#9ca3af',
            marginTop: '50px'
          }}>
            <Text type="secondary">
              Начните диалог с {sellerName}
            </Text>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === user?.id
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isOwn ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                {!isOwn && (
                  <Avatar 
                    size="small" 
                    src={msg.sender_avatar} 
                    icon={<UserOutlined />}
                  />
                )}
                
                <div
                  style={{
                    maxWidth: '70%',
                    background: isOwn ? '#00ff88' : '#374151',
                    color: isOwn ? '#000' : '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '12px',
                    wordWrap: 'break-word'
                  }}
                >
                  <div style={{ marginBottom: '4px' }}>
                    {!isOwn && (
                      <Text 
                        style={{ 
                          fontSize: '12px', 
                          color: '#9ca3af',
                          fontWeight: 'bold'
                        }}
                      >
                        {msg.sender_name}
                      </Text>
                    )}
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    {msg.message_text}
                  </div>
                  <div style={{ 
                    fontSize: '10px', 
                    opacity: 0.7,
                    textAlign: 'right'
                  }}>
                    {formatTime(msg.created_at)}
                  </div>
                </div>

                {isOwn && (
                  <Avatar 
                    size="small" 
                    src={user?.avatar_url} 
                    icon={<UserOutlined />}
                  />
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <Divider style={{ margin: 0, borderColor: '#374151' }} />

      {/* Поле ввода */}
      <div style={{ padding: '16px' }}>
        <Space.Compact style={{ width: '100%' }}>
          <TextArea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            rows={2}
            maxLength={500}
            style={{
              background: '#2a2a2a',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#ffffff',
              resize: 'none'
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={sending}
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || !wsConnected}
            style={{
              background: '#00ff88',
              borderColor: '#00ff88',
              color: '#000',
              height: 'auto'
            }}
          />
        </Space.Compact>
        <div style={{ 
          textAlign: 'right', 
          marginTop: '4px',
          fontSize: '12px',
          color: '#9ca3af'
        }}>
          {newMessage.length}/500
          {!wsConnected && (
            <span style={{ color: '#ff6b6b', marginLeft: '8px' }}>
              Подключение...
            </span>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ChatWebSocket