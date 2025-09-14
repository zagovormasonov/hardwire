import React, { useState, useEffect, useRef } from 'react'
import { Card, Input, Button, Avatar, Typography, Space, Divider, message, Spin } from 'antd'
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

interface ChatProps {
  sellerId: string
  sellerName: string
  sellerAvatar?: string
  productTitle?: string
  onClose?: () => void
}

const Chat: React.FC<ChatProps> = ({ 
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
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  console.log('Chat: Компонент рендерится', { sellerId, sellerName, productTitle, userId: user?.id })

  // Загружаем историю сообщений
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return

      try {
        console.log('Chat: Загружаем историю сообщений')
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!messages_sender_id_fkey(name, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Chat: Ошибка загрузки сообщений:', error)
          message.error('Не удалось загрузить сообщения')
          return
        }

        console.log('Chat: Загружено сообщений:', data?.length)
        setMessages(data || [])
      } catch (error) {
        console.error('Chat: Ошибка при загрузке сообщений:', error)
        message.error('Произошла ошибка при загрузке сообщений')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [user, sellerId])

  // Подписываемся на новые сообщения через WebSocket
  useEffect(() => {
    if (!user) return

    console.log('Chat: Подписываемся на WebSocket канал')
    
    // Создаем канал для чата между двумя пользователями
    const channelName = `chat_${[user.id, sellerId].sort().join('_')}`
    
    channelRef.current = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id}))`
        },
        async (payload) => {
          console.log('Chat: Получено новое сообщение через WebSocket:', payload)
          
          // Получаем информацию об отправителе
          const { data: senderData } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage: Message = {
            id: payload.new.id,
            sender_id: payload.new.sender_id,
            receiver_id: payload.new.receiver_id,
            message_text: payload.new.message_text,
            created_at: payload.new.created_at,
            sender_name: senderData?.name,
            sender_avatar: senderData?.avatar_url
          }

          setMessages(prev => [...prev, newMessage])
          
          // Прокручиваем к последнему сообщению
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        }
      )
      .subscribe((status) => {
        console.log('Chat: WebSocket статус:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Chat: WebSocket успешно подключен')
        } else if (status === 'CHANNEL_ERROR') {
          console.log('Chat: Ошибка WebSocket подключения')
        }
      })

    return () => {
      console.log('Chat: Отписываемся от WebSocket канала')
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [user, sellerId])

  // Fallback: периодическое обновление сообщений (если WebSocket не работает)
  useEffect(() => {
    if (!user) return

    console.log('Chat: Запускаем fallback обновление сообщений')
    
    const updateMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select(`
            *,
            sender:users!messages_sender_id_fkey(name, avatar_url)
          `)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Chat: Ошибка fallback обновления:', error)
          return
        }

        const updatedMessages = data?.map(msg => ({
          ...msg,
          sender_name: (msg.sender as any)?.name,
          sender_avatar: (msg.sender as any)?.avatar_url
        })) || []

        setMessages(prev => {
          // Проверяем, есть ли новые сообщения
          if (prev.length !== updatedMessages.length) {
            console.log('Chat: Fallback обнаружил новые сообщения')
            return updatedMessages
          }
          return prev
        })
      } catch (error) {
        console.error('Chat: Ошибка при fallback обновлении:', error)
      }
    }

    // Обновляем каждые 1.5 секунды как fallback (более агрессивно)
    const interval = setInterval(updateMessages, 1500)

    return () => {
      console.log('Chat: Останавливаем fallback обновление')
      clearInterval(interval)
    }
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
    if (!newMessage.trim() || !user) return

    setSending(true)
    try {
      console.log('Chat: Отправляем сообщение:', newMessage)
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: sellerId,
          message_text: newMessage.trim()
        })

      if (error) {
        console.error('Chat: Ошибка отправки сообщения:', error)
        message.error('Не удалось отправить сообщение')
        return
      }

      console.log('Chat: Сообщение отправлено успешно')
      
      // Добавляем сообщение в локальное состояние сразу
      const newMessageObj: Message = {
        id: `temp-${Date.now()}`, // Временный ID
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
      
      // Принудительно обновляем сообщения через 1 секунду (на случай если WebSocket не работает)
      setTimeout(async () => {
        try {
          const { data } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users!messages_sender_id_fkey(name, avatar_url)
            `)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true })

          const updatedMessages = data?.map(msg => ({
            ...msg,
            sender_name: (msg.sender as any)?.name,
            sender_avatar: (msg.sender as any)?.avatar_url
          })) || []

          setMessages(updatedMessages)
          console.log('Chat: Принудительное обновление выполнено')
        } catch (error) {
          console.error('Chat: Ошибка принудительного обновления:', error)
        }
      }, 1000)
      
      // Отправляем push-уведомление
      try {
        await supabase.functions.invoke('send-push-notification', {
          body: {
            user_id: sellerId,
            title: 'Новое сообщение',
            body: `${user.full_name || 'Пользователь'} написал вам: ${newMessageObj.message_text.substring(0, 50)}${newMessageObj.message_text.length > 50 ? '...' : ''}`,
            data: {
              type: 'message',
              sender_id: user.id,
              sender_name: user.full_name || 'Пользователь',
              product_title: productTitle
            }
          }
        })
      } catch (pushError) {
        console.error('Chat: Ошибка отправки push-уведомления:', pushError)
      }

    } catch (error) {
      console.error('Chat: Общая ошибка при отправке сообщения:', error)
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
      <Card style={{ height: '500px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </Card>
    )
  }

  return (
    <Card
      title={
        <Space>
          <Avatar src={sellerAvatar} icon={<UserOutlined />} />
          <div>
            <Title level={5} style={{ margin: 0, color: '#ffffff' }}>
              {sellerName}
            </Title>
            {productTitle && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                по товару "{productTitle}"
              </Text>
            )}
          </div>
        </Space>
      }
      style={{
        height: '500px',
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a1a',
        border: '1px solid #374151',
        borderRadius: '12px'
      }}
      styles={{
        header: { 
          background: '#1a1a1a', 
          borderBottom: '1px solid #374151',
          padding: '16px'
        },
        body: { 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          padding: 0
        }
      }}
      extra={
        onClose && (
          <Button 
            type="text" 
            onClick={onClose}
            style={{ color: '#9ca3af' }}
          >
            ✕
          </Button>
        )
      }
    >
      {/* Область сообщений */}
      <div 
        style={{ 
          flex: 1, 
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
            disabled={!newMessage.trim()}
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
        </div>
      </div>
    </Card>
  )
}

export default Chat
