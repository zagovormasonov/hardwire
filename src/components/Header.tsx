import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout, Menu, Input, Button, Avatar, Dropdown, Space, Typography } from 'antd'
import { SearchOutlined, BellOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useSearch } from '../contexts/SearchContext'

const { Header: AntHeader } = Layout
const { Text } = Typography

const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const { searchQuery, setSearchQuery, performSearch } = useSearch()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      // Обработка ошибки
    }
  }

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: <Link to="/profile">Профиль</Link>,
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Выйти',
      onClick: handleSignOut,
    },
  ]

  const menuItems = [
    {
      key: 'feed',
      label: <Link to="/feed">Лента</Link>,
    },
    {
      key: 'categories',
      label: <Link to="/categories">Категории</Link>,
    },
    ...(user ? [{
      key: 'create',
      label: <Link to="/create">Продать</Link>,
    }] : []),
  ]

  return (
    <AntHeader 
      style={{ 
        padding: '0 24px',
        background: '#1a1a1a',
        borderBottom: '1px solid #374151',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        height: '100%',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* Логотип */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Avatar 
            size={40}
            style={{ 
              background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
              color: '#000',
              fontWeight: 'bold',
              marginRight: '12px',
            }}
          >
            H
          </Avatar>
          <Text 
            style={{ 
              fontSize: '20px', 
              fontWeight: 'bold', 
              color: '#00ff88',
              margin: 0,
            }}
          >
            HardWire
          </Text>
        </Link>

        {/* Навигация */}
        <Menu
          mode="horizontal"
          items={menuItems}
          style={{
            background: 'transparent',
            border: 'none',
            flex: 1,
            justifyContent: 'center',
            color: '#ffffff',
          }}
          theme="dark"
        />

        {/* Поиск */}
        <div style={{ margin: '0 24px', flex: '0 0 300px' }}>
          <Input
            placeholder="Поиск железа..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={performSearch}
            style={{
              background: '#2a2a2a',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
          />
        </div>

        {/* Пользователь */}
        <Space size="middle">
          {user ? (
            <>
              {/* Уведомления */}
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: '#ffffff' }}
              />

              {/* Профиль */}
              <Dropdown
                menu={{ items: userMenuItems }}
                placement="bottomRight"
                trigger={['click']}
              >
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar 
                    src={user.avatar_url}
                    icon={<UserOutlined />}
                    size={32}
                  />
                  <Text style={{ color: '#ffffff' }}>
                    {user.full_name}
                  </Text>
                </Space>
              </Dropdown>
            </>
          ) : (
            <Space>
              <Button type="text" style={{ color: '#ffffff' }}>
                <Link to="/login">Войти</Link>
              </Button>
              <Button 
                type="primary" 
                style={{ 
                  background: '#00ff88',
                  borderColor: '#00ff88',
                  color: '#000',
                }}
              >
                <Link to="/register" style={{ color: '#000' }}>Регистрация</Link>
              </Button>
            </Space>
          )}
        </Space>
      </div>
    </AntHeader>
  )
}

export default Header