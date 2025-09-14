import React, { useState, useEffect } from 'react'
import { Card, Avatar, Typography, Space, Badge, Empty, Spin } from 'antd'
import { UserOutlined, MessageOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const { Text, Title } = Typography

interface ChatPreview {
  id: string
  other_user_id: string
  other_user_name: string
  other_user_avatar?: string
  last_message: string
  last_message_time: string
  unread_count: number
  product_title?: string
}

interface ChatListProps {
  onChatSelect: (sellerId: string, sellerName: string, sellerAvatar?: string, productTitle?: string) => void
}

const ChatList: React.FC<ChatListProps> = ({ onChatSelect }) => {
  const { user } = useAuth()
  const [chats, setChats] = useState<ChatPreview[]>([])
  const [loading, setLoading] = useState(true)

  console.log('ChatList: Компонент рендерится', { userId: user?.id })

  // Загружаем список чатов
  useEffect(() => {
    const loadChats = async () => {
      if (!user) return

      try {
        console.log('ChatList: Загружаем список чатов')
        
        // Получаем последние сообщения для каждого чата
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select(`
            sender_id,
            receiver_id,
            message_text,
            created_at,
            sender:users!messages_sender_id_fkey(name, avatar_url),
            receiver:users!messages_receiver_id_fkey(name, avatar_url)
          `)
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(50)

        if (messagesError) {
          console.error('ChatList: Ошибка загрузки сообщений:', messagesError)
          return
        }

        // Группируем сообщения по чатам
        const chatMap = new Map<string, ChatPreview>()
        
        messagesData?.forEach((message) => {
          const isSentByMe = message.sender_id === user.id
          const otherUserId = isSentByMe ? message.receiver_id : message.sender_id
          const otherUserName = isSentByMe ? 
            (message.receiver as any)?.name : 
            (message.sender as any)?.name
          const otherUserAvatar = isSentByMe ? 
            (message.receiver as any)?.avatar_url : 
            (message.sender as any)?.avatar_url
          
          const chatKey = otherUserId
          
          if (!chatMap.has(chatKey)) {
            chatMap.set(chatKey, {
              id: chatKey,
              other_user_id: otherUserId,
              other_user_name: otherUserName || 'Неизвестный пользователь',
              other_user_avatar: otherUserAvatar,
              last_message: message.message_text,
              last_message_time: message.created_at,
              unread_count: 0
            })
          }
        })

        // Получаем количество непрочитанных сообщений
        const { data: unreadData } = await supabase
          .from('messages')
          .select('receiver_id, sender_id')
          .eq('receiver_id', user.id)
          .eq('is_read', false)

        // Подсчитываем непрочитанные сообщения для каждого чата
        unreadData?.forEach((unread) => {
          const chatKey = unread.sender_id
          const chat = chatMap.get(chatKey)
          if (chat) {
            chat.unread_count++
          }
        })

        const chatsArray = Array.from(chatMap.values())
          .sort((a, b) => new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime())

        console.log('ChatList: Загружено чатов:', chatsArray.length)
        setChats(chatsArray)

      } catch (error) {
        console.error('ChatList: Ошибка при загрузке чатов:', error)
      } finally {
        setLoading(false)
      }
    }

    loadChats()
  }, [user])

  // Подписываемся на новые сообщения для обновления списка чатов
  useEffect(() => {
    if (!user) return

    console.log('ChatList: Подписываемся на новые сообщения')
    
    const channel = supabase
      .channel('chat_list_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${user.id},receiver_id.eq.${user.id})`
        },
        (payload) => {
          console.log('ChatList: Получено новое сообщение, обновляем список чатов')
          
          // Обновляем список чатов
          setChats(prevChats => {
            const isSentByMe = payload.new.sender_id === user.id
            const otherUserId = isSentByMe ? payload.new.receiver_id : payload.new.sender_id
            
            // Ищем существующий чат
            const existingChatIndex = prevChats.findIndex(chat => chat.other_user_id === otherUserId)
            
            if (existingChatIndex >= 0) {
              // Обновляем существующий чат
              const updatedChats = [...prevChats]
              updatedChats[existingChatIndex] = {
                ...updatedChats[existingChatIndex],
                last_message: payload.new.message_text,
                last_message_time: payload.new.created_at,
                unread_count: isSentByMe ? updatedChats[existingChatIndex].unread_count : updatedChats[existingChatIndex].unread_count + 1
              }
              
              // Перемещаем чат в начало списка
              const [updatedChat] = updatedChats.splice(existingChatIndex, 1)
              return [updatedChat, ...updatedChats]
            } else {
              // Создаем новый чат (нужно получить информацию о пользователе)
              // Для простоты пока не добавляем новый чат автоматически
              return prevChats
            }
          })
        }
      )
      .subscribe()

    return () => {
      console.log('ChatList: Отписываемся от обновлений чатов')
      supabase.removeChannel(channel)
    }
  }, [user])

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return 'только что'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч`
    
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    })
  }

  const handleChatClick = (chat: ChatPreview) => {
    console.log('ChatList: Выбран чат с пользователем:', chat.other_user_name)
    onChatSelect(chat.other_user_id, chat.other_user_name, chat.other_user_avatar, chat.product_title)
  }

  if (loading) {
    return (
      <Card style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" />
      </Card>
    )
  }

  return (
    <Card
      title={
        <Space>
          <MessageOutlined style={{ color: '#00ff88' }} />
          <Title level={5} style={{ margin: 0, color: '#ffffff' }}>
            Сообщения
          </Title>
        </Space>
      }
      style={{
        height: '400px',
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
          padding: 0,
          height: 'calc(100% - 60px)',
          overflow: 'hidden'
        }
      }}
    >
      {chats.length === 0 ? (
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}>
          <Empty
            description={
              <Text type="secondary">
                У вас пока нет сообщений
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <div style={{ 
          height: '100%', 
          overflowY: 'auto',
          padding: '8px'
        }}>
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatClick(chat)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                marginBottom: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2a2a2a'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <Badge count={chat.unread_count} size="small">
                <Avatar 
                  src={chat.other_user_avatar} 
                  icon={<UserOutlined />}
                  size="large"
                />
              </Badge>
              
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '4px'
                }}>
                  <Text 
                    strong 
                    style={{ 
                      color: '#ffffff',
                      fontSize: '14px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {chat.other_user_name}
                  </Text>
                  <Text 
                    type="secondary" 
                    style={{ 
                      fontSize: '12px',
                      flexShrink: 0,
                      marginLeft: '8px'
                    }}
                  >
                    {formatTime(chat.last_message_time)}
                  </Text>
                </div>
                
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '13px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block'
                  }}
                >
                  {chat.last_message}
                </Text>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default ChatList
