import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Avatar, 
  Space, 
  Spin, 
  Empty,
  Tag,
  Divider,
  Statistic
} from 'antd'
import { 
  ArrowLeftOutlined, 
  InboxOutlined, 
  EyeOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { supabase } from '../lib/supabase'

const { Title, Text } = Typography

// Типы для товаров
interface Product {
  id: string
  title: string
  description: string
  price: number
  category: string
  condition: 'new' | 'used' | 'refurbished'
  images: string[]
  seller_id: string
  created_at: string
  updated_at: string
  is_sold: boolean
  is_active: boolean
}

// Типы для пользователя
interface User {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

const SellerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [seller, setSeller] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchSellerData()
    }
  }, [id])

  const fetchSellerData = async () => {
    try {
      setLoading(true)
      
      // Получаем информацию о продавце
      const { data: sellerData, error: sellerError } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (sellerError) throw sellerError

      if (!sellerData) {
        return
      }

      setSeller(sellerData)

      // Получаем товары продавца
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', id)
        .eq('is_active', true)
        .eq('is_sold', false)
        .order('created_at', { ascending: false })

      if (productsError) throw productsError

      setProducts(productsData || [])
    } catch (error) {
      console.error('Error fetching seller data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
  }

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'new': return 'Новый'
      case 'used': return 'Б/У'
      case 'refurbished': return 'Восстановленный'
      default: return condition
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'green'
      case 'used': return 'orange'
      case 'refurbished': return 'blue'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!seller) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Empty description="Продавец не найден" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(-1)}
        style={{ marginBottom: '24px' }}
      >
        Назад
      </Button>

      {/* Информация о продавце */}
      <Card
        style={{
          background: '#1a1a1a',
          border: '1px solid #374151',
          borderRadius: '16px',
          marginBottom: '32px',
        }}
        bodyStyle={{ padding: '32px' }}
      >
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <Avatar
              src={seller.avatar_url}
              size={120}
              icon={<UserOutlined />}
              style={{
                background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                color: '#000',
                fontSize: '48px',
                fontWeight: 'bold',
              }}
            >
              {seller.full_name.charAt(0).toUpperCase()}
            </Avatar>
          </Col>
          
          <Col xs={24} md={16}>
            <div>
              <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
                {seller.full_name}
              </Title>
              
              <div style={{ marginBottom: '16px' }}>
                <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
                  Продавец на платформе
                </Text>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Space>
                  <CalendarOutlined style={{ color: '#9ca3af' }} />
                  <Text style={{ color: '#9ca3af' }}>
                    На платформе с {new Date(seller.created_at).toLocaleDateString('ru-RU')}
                  </Text>
                </Space>
              </div>

              <div>
                <Space>
                  <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    style={{
                      background: '#00ff88',
                      borderColor: '#00ff88',
                      color: '#000',
                    }}
                  >
                    Написать продавцу
                  </Button>
                </Space>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Статистика продавца */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={12} sm={6}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '12px',
              textAlign: 'center',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>Всего товаров</Text>}
              value={products.length}
              valueStyle={{ color: '#00ff88' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '12px',
              textAlign: 'center',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>Активных</Text>}
              value={products.filter(p => p.is_active && !p.is_sold).length}
              valueStyle={{ color: '#00ff88' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '12px',
              textAlign: 'center',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>Проданных</Text>}
              value={products.filter(p => p.is_sold).length}
              valueStyle={{ color: '#00ff88' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '12px',
              textAlign: 'center',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Statistic
              title={<Text style={{ color: '#9ca3af' }}>Средняя цена</Text>}
              value={products.length > 0 ? Math.round(products.reduce((sum, p) => sum + p.price, 0) / products.length) : 0}
              suffix="₽"
              valueStyle={{ color: '#00ff88' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Товары продавца */}
      <Card
        style={{
          background: '#1a1a1a',
          border: '1px solid #374151',
          borderRadius: '16px',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ marginBottom: '24px' }}>
          <Title level={3} style={{ color: '#ffffff', margin: 0 }}>
            Товары продавца
          </Title>
          <Text style={{ color: '#9ca3af' }}>
            {products.length} товаров
          </Text>
        </div>

        {products.length === 0 ? (
          <Empty description="У продавца пока нет активных товаров" />
        ) : (
          <Row gutter={[24, 24]}>
            {products.map((product) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={product.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/product/${product.id}`)}
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                  bodyStyle={{ padding: '16px' }}
                  cover={
                    <div style={{ height: '200px', overflow: 'hidden' }}>
                      {product.images && product.images.length > 0 ? (
                        <img
                          alt={product.title}
                          src={product.images[0]}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '100%',
                          height: '100%',
                          background: '#1a1a1a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#9ca3af',
                        }}>
                          <InboxOutlined style={{ fontSize: '32px' }} />
                        </div>
                      )}
                    </div>
                  }
                >
                  <div style={{ marginBottom: '12px' }}>
                    <Title level={5} style={{ color: '#ffffff', margin: 0, fontSize: '14px' }}>
                      {product.title}
                    </Title>
                    <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {product.category}
                    </Text>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <Tag color={getConditionColor(product.condition)}>
                      {getConditionText(product.condition)}
                    </Tag>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff88' }}>
                      {formatPrice(product.price)}
                    </Text>
                  </div>

                  <Divider style={{ borderColor: '#374151', margin: '12px 0' }} />

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {new Date(product.created_at).toLocaleDateString('ru-RU')}
                    </Text>
                    
                    <Button
                      type="primary"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        navigate(`/product/${product.id}`)
                      }}
                      style={{
                        background: '#00ff88',
                        borderColor: '#00ff88',
                        color: '#000',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      Смотреть
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  )
}

export default SellerProfile