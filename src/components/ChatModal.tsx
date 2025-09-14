import React, { useState } from 'react'
import { Modal, Tabs, Space } from 'antd'
import { MessageOutlined, UserOutlined } from '@ant-design/icons'
import Chat from './Chat'
import ChatList from './ChatList'

interface ChatModalProps {
  visible: boolean
  onClose: () => void
  sellerId?: string
  sellerName?: string
  sellerAvatar?: string
  productTitle?: string
}

const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  sellerId,
  sellerName,
  sellerAvatar,
  productTitle
}) => {
  const [activeTab, setActiveTab] = useState('list')
  const [selectedChat, setSelectedChat] = useState<{
    sellerId: string
    sellerName: string
    sellerAvatar?: string
    productTitle?: string
  } | null>(null)

  console.log('ChatModal: Компонент рендерится', { 
    visible, 
    sellerId, 
    sellerName, 
    productTitle,
    activeTab,
    selectedChat 
  })

  const handleChatSelect = (sellerId: string, sellerName: string, sellerAvatar?: string, productTitle?: string) => {
    console.log('ChatModal: Выбран чат', { sellerId, sellerName, sellerAvatar, productTitle })
    setSelectedChat({ sellerId, sellerName, sellerAvatar, productTitle })
    setActiveTab('chat')
  }

  const handleBackToList = () => {
    console.log('ChatModal: Возвращаемся к списку чатов')
    setSelectedChat(null)
    setActiveTab('list')
  }

  const handleClose = () => {
    console.log('ChatModal: Закрываем модальное окно')
    setSelectedChat(null)
    setActiveTab('list')
    onClose()
  }

  // Если передан конкретный продавец, сразу открываем чат с ним
  React.useEffect(() => {
    if (visible && sellerId && sellerName) {
      console.log('ChatModal: Открываем чат с конкретным продавцом')
      setSelectedChat({ 
        sellerId, 
        sellerName, 
        sellerAvatar, 
        productTitle 
      })
      setActiveTab('chat')
    }
  }, [visible, sellerId, sellerName, sellerAvatar, productTitle])

  const tabItems = [
    {
      key: 'list',
      label: (
        <Space>
          <UserOutlined />
          Список чатов
        </Space>
      ),
      children: (
        <ChatList onChatSelect={handleChatSelect} />
      )
    },
    {
      key: 'chat',
      label: (
        <Space>
          <MessageOutlined />
          {selectedChat ? `Чат с ${selectedChat.sellerName}` : 'Чат'}
        </Space>
      ),
      children: selectedChat ? (
        <Chat
          sellerId={selectedChat.sellerId}
          sellerName={selectedChat.sellerName}
          sellerAvatar={selectedChat.sellerAvatar}
          productTitle={selectedChat.productTitle}
          onClose={handleBackToList}
        />
      ) : (
        <div style={{ 
          height: '400px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          color: '#9ca3af'
        }}>
          Выберите чат из списка
        </div>
      )
    }
  ]

  return (
    <Modal
      title={
        <Space>
          <MessageOutlined style={{ color: '#00ff88' }} />
          <span style={{ color: '#ffffff' }}>Сообщения</span>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
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
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{
          background: '#1a1a1a'
        }}
        tabBarStyle={{
          margin: 0,
          background: '#1a1a1a',
          borderBottom: '1px solid #374151'
        }}
      />
    </Modal>
  )
}

export default ChatModal
