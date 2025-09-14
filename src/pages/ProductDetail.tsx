import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Space, 
  Avatar, 
  Tag, 
  Spin, 
  Empty,
  Image,
  Divider
} from 'antd'
import { 
  ArrowLeftOutlined, 
  HeartOutlined, 
  MessageOutlined, 
  ShareAltOutlined,
  UserOutlined
} from '@ant-design/icons'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

const { Title, Text, Paragraph } = Typography

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
  users?: {
    full_name: string
    avatar_url?: string
    email: string
  }
}

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users!products_seller_id_fkey (
            full_name,
            avatar_url,
            email
          ),
          favorites!left (
            id,
            user_id
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setProduct(data)
      
      // Проверяем, добавлен ли товар в избранное текущим пользователем
      if (user && data.favorites) {
        const userFavorite = data.favorites.find((fav: any) => fav.user_id === user.id)
        setIsLiked(!!userFavorite)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
  }

  const toggleLike = async () => {
    if (!user) {
      addNotification({
        type: 'warning',
        title: 'Необходима авторизация',
        message: 'Войдите в систему, чтобы добавлять товары в избранное'
      })
      return
    }

    if (!product) return

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('product_id', product.id)
          .eq('user_id', user.id)

        if (error) throw error

        setIsLiked(false)
        addNotification({
          type: 'info',
          title: 'Удалено из избранного',
          message: 'Товар больше не в вашем списке избранного'
        })
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ product_id: product.id, user_id: user.id }])

        if (error) throw error

        setIsLiked(true)
        addNotification({
          type: 'success',
          title: 'Добавлено в избранное',
          message: 'Товар добавлен в ваш список избранного'
        })
      }
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось обновить избранное. Попробуйте еще раз.'
      })
    }
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

  if (!product) {
    return (
      <div style={{ padding: '24px 0' }}>
        <Empty description="Товар не найден" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => window.history.back()}
        style={{ marginBottom: '24px' }}
      >
        Назад
      </Button>

      <Row gutter={[32, 32]}>
        {/* Изображения */}
        <Col xs={24} lg={12}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '16px',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            {product.images && product.images.length > 0 ? (
              <Image.PreviewGroup>
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  style={{
                    width: '100%',
                    borderRadius: '8px',
                  }}
                />
                {product.images.length > 1 && (
                  <div style={{ marginTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {product.images.slice(1).map((image, index) => (
                      <Image
                        key={index}
                        src={image}
                        alt={`${product.title} ${index + 2}`}
                        style={{
                          width: '80px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                        }}
                      />
                    ))}
                  </div>
                )}
              </Image.PreviewGroup>
            ) : (
              <div style={{
                width: '100%',
                height: '400px',
                background: '#2a2a2a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                color: '#9ca3af',
              }}>
                Нет изображений
              </div>
            )}
          </Card>
        </Col>

        {/* Информация о товаре */}
        <Col xs={24} lg={12}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '16px',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <div style={{ marginBottom: '24px' }}>
              <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
                {product.title}
              </Title>
              
              <Space size="middle" style={{ marginBottom: '16px' }}>
                <Tag color="blue">{product.category}</Tag>
                <Tag color={getConditionColor(product.condition)}>
                  {getConditionText(product.condition)}
                </Tag>
                {product.is_sold && <Tag color="red">Продан</Tag>}
              </Space>

              <Title level={1} style={{ color: '#00ff88', margin: '16px 0' }}>
                {formatPrice(product.price)}
              </Title>
            </div>

            <Divider style={{ borderColor: '#374151' }} />

            <div style={{ marginBottom: '24px' }}>
              <Title level={4} style={{ color: '#ffffff', marginBottom: '12px' }}>
                Описание
              </Title>
              <Paragraph style={{ color: '#9ca3af', fontSize: '16px', lineHeight: '1.6' }}>
                {product.description}
              </Paragraph>
            </div>

            <Divider style={{ borderColor: '#374151' }} />

            {/* Информация о продавце */}
            <div style={{ marginBottom: '24px' }}>
              <Title level={4} style={{ color: '#ffffff', marginBottom: '12px' }}>
                Продавец
              </Title>
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s',
                }}
                onClick={() => navigate(`/profile/${product.seller_id}`)}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Avatar
                  src={product.users?.avatar_url}
                  size={48}
                  icon={<UserOutlined />}
                />
                <div>
                  <Text style={{ color: '#ffffff', fontSize: '16px', fontWeight: 'bold' }}>
                    {product.users?.full_name}
                  </Text>
                  <br />
                  <Text style={{ color: '#9ca3af', fontSize: '14px' }}>
                    Продавец
                  </Text>
                </div>
              </div>
            </div>

            {/* Действия */}
            <Space size="middle" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<MessageOutlined />}
                size="large"
                style={{
                  background: '#00ff88',
                  borderColor: '#00ff88',
                  color: '#000',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Написать продавцу
              </Button>
              
              <Button
                icon={<HeartOutlined />}
                size="large"
                onClick={toggleLike}
                style={{
                  background: isLiked ? '#ff4757' : 'transparent',
                  borderColor: isLiked ? '#ff4757' : '#374151',
                  color: isLiked ? '#ffffff' : '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isLiked ? 'В избранном' : 'В избранное'}
              </Button>
              
              <Button
                icon={<ShareAltOutlined />}
                size="large"
                style={{
                  background: 'transparent',
                  borderColor: '#374151',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                Поделиться
              </Button>
            </Space>

            {/* Дополнительная информация */}
            <Divider style={{ borderColor: '#374151' }} />
            
            <div style={{ color: '#9ca3af', fontSize: '14px' }}>
              <Text>Дата публикации: {new Date(product.created_at).toLocaleDateString('ru-RU')}</Text>
              <br />
              <Text>Обновлено: {new Date(product.updated_at).toLocaleDateString('ru-RU')}</Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default ProductDetail