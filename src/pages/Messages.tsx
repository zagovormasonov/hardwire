import React from 'react'
import { Layout, Typography } from 'antd'
import ChatModal from '../components/ChatModal'

const { Content } = Layout
const { Title } = Typography

const Messages: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <Title level={2} style={{ color: '#ffffff', marginBottom: '24px' }}>
            Сообщения
          </Title>
          
          <ChatModal
            visible={true}
            onClose={() => window.history.back()}
          />
        </div>
      </Content>
    </Layout>
  )
}

export default Messages
