import React, { useState } from 'react'
import { Layout, Typography, Button, Space } from 'antd'
import { ArrowLeftOutlined, MessageOutlined } from '@ant-design/icons'
import ChatList from '../components/ChatList'
import ChatSimple from '../components/ChatSimple'
import { useAuth } from '../contexts/AuthContext'

const { Content } = Layout
const { Title } = Typography

const Messages: React.FC = () => {
  const { user } = useAuth()
  const [selectedChat, setSelectedChat] = useState<{
    sellerId: string
    sellerName: string
    sellerAvatar?: string
    productTitle?: string
  } | null>(null)

  const handleChatSelect = (sellerId: string, sellerName: string, sellerAvatar?: string, productTitle?: string) => {
    setSelectedChat({ sellerId, sellerName, sellerAvatar, productTitle })
  }

  const handleBackToList = () => {
    setSelectedChat(null)
  }

  if (!user) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
        <Content style={{ padding: '24px' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <Title level={2} style={{ color: '#ffffff' }}>
              Войдите в систему для просмотра сообщений
            </Title>
          </div>
        </Content>
      </Layout>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <Space>
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => window.history.back()}
                style={{ background: '#2a2a2a', border: '1px solid #374151', color: '#ffffff' }}
              >
                Назад
              </Button>
              <Title level={2} style={{ color: '#ffffff', margin: 0 }}>
                <MessageOutlined style={{ color: '#00ff88', marginRight: '8px' }} />
                Сообщения
              </Title>
            </Space>
          </div>
          
          {selectedChat ? (
            <ChatSimple
              sellerId={selectedChat.sellerId}
              sellerName={selectedChat.sellerName}
              sellerAvatar={selectedChat.sellerAvatar}
              productTitle={selectedChat.productTitle}
              onClose={handleBackToList}
              isModal={false}
            />
          ) : (
            <ChatList onChatSelect={handleChatSelect} />
          )}
        </div>
      </Content>
    </Layout>
  )
}

export default Messages
