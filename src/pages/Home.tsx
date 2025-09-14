import React from 'react'
import { Link } from 'react-router-dom'
import { Card, Row, Col, Typography, Button, Space } from 'antd'
import { DesktopOutlined, HddOutlined, ThunderboltOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Title, Paragraph, Text } = Typography

const Home: React.FC = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: <DesktopOutlined style={{ fontSize: '32px', color: '#00ff88' }} />,
      title: 'Процессоры',
      description: 'Найди идеальный CPU для своей сборки'
    },
    {
      icon: <DesktopOutlined style={{ fontSize: '32px', color: '#00ff88' }} />,
      title: 'Видеокарты',
      description: 'RTX, GTX, RX - все карты в одном месте'
    },
    {
      icon: <HddOutlined style={{ fontSize: '32px', color: '#00ff88' }} />,
      title: 'Комплектующие',
      description: 'Материнские платы, память, накопители'
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: '32px', color: '#00ff88' }} />,
      title: 'Быстрая продажа',
      description: 'Продай свое железо за считанные минуты'
    }
  ]

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '64px' }}>
        <Title 
          level={1} 
          style={{ 
            fontSize: '48px', 
            fontWeight: 'bold', 
            color: '#ffffff',
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          HardWire
        </Title>
        <Paragraph 
          style={{ 
            fontSize: '20px', 
            color: '#9ca3af',
            marginBottom: '32px',
            maxWidth: '600px',
            margin: '0 auto 32px',
          }}
        >
          Современная биржа комплектующих ПК. Покупай, продавай, обновляй свое железо!
        </Paragraph>
        
        <Space size="large">
          <Button 
            type="primary" 
            size="large"
            style={{ 
              background: '#00ff88',
              borderColor: '#00ff88',
              color: '#000',
              height: '48px',
              padding: '0 32px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            <Link to="/feed" style={{ color: '#000' }}>Смотреть товары</Link>
          </Button>
          {user ? (
            <Button 
              size="large"
              style={{ 
                height: '48px',
                padding: '0 32px',
                fontSize: '16px',
                color: '#ffffff',
                borderColor: '#00ff88',
              }}
            >
              <Link to="/create">Продать товар</Link>
            </Button>
          ) : (
            <Button 
              size="large"
              style={{ 
                height: '48px',
                padding: '0 32px',
                fontSize: '16px',
                color: '#ffffff',
                borderColor: '#00ff88',
              }}
            >
              <Link to="/register">Начать продавать</Link>
            </Button>
          )}
        </Space>
      </div>

      {/* Features */}
      <Row gutter={[24, 24]} style={{ marginBottom: '64px' }}>
        {features.map((feature, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              style={{
                height: '100%',
                background: '#1a1a1a',
                border: '1px solid #374151',
                borderRadius: '12px',
                textAlign: 'center',
                transition: 'all 0.3s ease',
              }}
              bodyStyle={{ padding: '32px 24px' }}
              hoverable
            >
              <div style={{ marginBottom: '16px' }}>
                {feature.icon}
              </div>
              <Title level={4} style={{ color: '#ffffff', marginBottom: '8px' }}>
                {feature.title}
              </Title>
              <Paragraph style={{ color: '#9ca3af', margin: 0 }}>
                {feature.description}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Stats */}
      <Row gutter={[24, 24]} style={{ marginBottom: '64px' }}>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '12px',
              textAlign: 'center',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Title level={2} style={{ color: '#00ff88', margin: 0 }}>
              1,000+
            </Title>
            <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
              Активных товаров
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '12px',
              textAlign: 'center',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Title level={2} style={{ color: '#00ff88', margin: 0 }}>
              500+
            </Title>
            <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
              Довольных покупателей
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '12px',
              textAlign: 'center',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Title level={2} style={{ color: '#00ff88', margin: 0 }}>
              10+
            </Title>
            <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
              Категорий товаров
            </Text>
          </Card>
        </Col>
      </Row>

      {/* CTA Section */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
          border: '1px solid #374151',
          borderRadius: '16px',
          textAlign: 'center',
        }}
        bodyStyle={{ padding: '48px 24px' }}
      >
        <Title level={2} style={{ color: '#ffffff', marginBottom: '16px' }}>
          Готов начать торговать?
        </Title>
        <Paragraph style={{ color: '#9ca3af', fontSize: '18px', marginBottom: '32px' }}>
          Присоединяйся к сообществу HardWire и начни покупать и продавать комплектующие уже сегодня!
        </Paragraph>
        <Space size="large">
          <Button 
            type="primary" 
            size="large"
            style={{ 
              background: '#00ff88',
              borderColor: '#00ff88',
              color: '#000',
              height: '48px',
              padding: '0 32px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            <Link to="/feed" style={{ color: '#000' }}>
              Перейти к товарам <ArrowRightOutlined />
            </Link>
          </Button>
          {!user && (
            <Button 
              size="large"
              style={{ 
                height: '48px',
                padding: '0 32px',
                fontSize: '16px',
                color: '#ffffff',
                borderColor: '#00ff88',
              }}
            >
              <Link to="/register">Создать аккаунт</Link>
            </Button>
          )}
        </Space>
      </Card>
    </div>
  )
}

export default Home