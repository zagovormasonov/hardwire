import React from 'react'
import { Layout, Spin } from 'antd'
import Header from './Header'
import { useAuth } from '../contexts/AuthContext'

const { Content } = Layout

interface LayoutProps {
  children: React.ReactNode
}

const AppLayout: React.FC<LayoutProps> = ({ children }) => {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: '#0a0a0a',
      }}>
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Header />
      <Content style={{ 
        padding: window.innerWidth < 768 ? '16px' : '24px', 
        maxWidth: '1200px', 
        margin: '0 auto', 
        width: '100%' 
      }}>
        {children}
      </Content>
    </Layout>
  )
} 

export default AppLayout
