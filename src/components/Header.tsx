import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout, Menu, Input, Button, Avatar, Dropdown, Space, Typography, Drawer } from 'antd'
import { SearchOutlined, BellOutlined, LogoutOutlined, UserOutlined, MenuOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useSearch } from '../contexts/SearchContext'

const { Header: AntHeader } = Layout
const { Text } = Typography

const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const { searchQuery, setSearchQuery, performSearch } = useSearch()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      console.log('Header: Начинаем выход из системы')
      await signOut()
      console.log('Header: Выход успешен, перенаправляем на главную')
      navigate('/')
      
    } catch (error) {
      console.error('Header: Ошибка при выходе:', error)
      // Принудительно очищаем все и перенаправляем
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = '/'
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
      label: (
        <div onClick={handleSignOut} style={{ cursor: 'pointer' }}>
          Выйти
        </div>
      ),
    },
  ]

  const handleMenuClick = ({ key }: { key: string }) => {
    console.log('Header: Клик по меню, key:', key)
    if (key === 'logout') {
      console.log('Header: Выбран выход из системы')
      handleSignOut()
    }
  }

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
    <>
      <AntHeader 
        style={{ 
          padding: '0 16px',
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
              size={36}
              style={{ 
                background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                color: '#000',
                fontWeight: 'bold',
                marginRight: '8px',
              }}
            >
              H
            </Avatar>
            <Text 
              style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#00ff88',
                margin: 0,
                display: window.innerWidth < 768 ? 'none' : 'block',
              }}
            >
              HardWire
            </Text>
          </Link>

          {/* Десктопная навигация */}
          <div style={{ display: window.innerWidth >= 768 ? 'flex' : 'none', alignItems: 'center', flex: 1 }}>
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
            <div style={{ margin: '0 16px', flex: '0 0 250px' }}>
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
          </div>

          {/* Мобильная кнопка меню */}
          <div style={{ display: window.innerWidth < 768 ? 'flex' : 'none', alignItems: 'center' }}>
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setMobileMenuOpen(true)}
              style={{ color: '#ffffff', fontSize: '18px' }}
            />
          </div>

          {/* Десктопный пользователь */}
          <div style={{ display: window.innerWidth >= 768 ? 'flex' : 'none' }}>
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
                    menu={{ items: userMenuItems, onClick: handleMenuClick }}
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
        </div>
      </AntHeader>

      {/* Мобильное меню */}
      <Drawer
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Avatar 
              size={32}
              style={{ 
                background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                color: '#000',
                fontWeight: 'bold',
                marginRight: '12px',
              }}
            >
              H
            </Avatar>
            <Text style={{ color: '#00ff88', fontSize: '18px', fontWeight: 'bold' }}>
              HardWire
            </Text>
          </div>
        }
        placement="right"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={280}
        style={{
          background: '#1a1a1a',
        }}
        bodyStyle={{
          background: '#1a1a1a',
          padding: '24px 0',
        }}
      >
        {/* Мобильный поиск */}
        <div style={{ marginBottom: '24px', padding: '0 24px' }}>
          <Input
            placeholder="Поиск железа..."
            prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={() => {
              performSearch()
              setMobileMenuOpen(false)
            }}
            style={{
              background: '#2a2a2a',
              border: '1px solid #374151',
              borderRadius: '8px',
            }}
          />
        </div>

        {/* Мобильная навигация */}
        <Menu
          mode="vertical"
          items={menuItems.map(item => ({
            ...item,
            label: item.label && typeof item.label === 'object' && 'props' in item.label 
              ? { ...item.label, props: { ...item.label.props, onClick: () => setMobileMenuOpen(false) } }
              : item.label
          }))}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
          }}
          theme="dark"
        />

        {/* Мобильный профиль */}
        {user && (
          <div style={{ 
            padding: '24px', 
            borderTop: '1px solid #374151', 
            marginTop: '24px' 
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '16px' 
            }}>
              <Avatar 
                src={user.avatar_url}
                icon={<UserOutlined />}
                size={40}
                style={{ marginRight: '12px' }}
              />
              <div>
                <Text style={{ color: '#ffffff', display: 'block', fontWeight: 'bold' }}>
                  {user.full_name}
                </Text>
                <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                  {user.email}
                </Text>
              </div>
            </div>
            
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="text" 
                icon={<UserOutlined />}
                style={{ 
                  color: '#ffffff', 
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  height: '40px',
                }}
                block
              >
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                  Профиль
                </Link>
              </Button>
              
              <Button 
                type="text" 
                icon={<BellOutlined />}
                style={{ 
                  color: '#ffffff', 
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  height: '40px',
                }}
                block
              >
                Уведомления
              </Button>
              
              <Button 
                type="text" 
                icon={<LogoutOutlined />}
                onClick={handleSignOut}
                style={{ 
                  color: '#ff4757', 
                  textAlign: 'left',
                  justifyContent: 'flex-start',
                  height: '40px',
                }}
                block
              >
                Выйти
              </Button>
            </Space>
          </div>
        )}

        {/* Мобильная авторизация */}
        {!user && (
          <div style={{ 
            padding: '24px', 
            borderTop: '1px solid #374151', 
            marginTop: '24px' 
          }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary"
                style={{ 
                  background: '#00ff88',
                  borderColor: '#00ff88',
                  color: '#000',
                  height: '44px',
                }}
                block
              >
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  Регистрация
                </Link>
              </Button>
              
              <Button 
                style={{ 
                  color: '#ffffff', 
                  borderColor: '#374151',
                  height: '44px',
                }}
                block
              >
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  Войти
                </Link>
              </Button>
            </Space>
          </div>
        )}
      </Drawer>
    </>
  )
}

export default Header