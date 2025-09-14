import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { 
  Card, 
  Row, 
  Col, 
  Input, 
  Button, 
  Select, 
  Checkbox, 
  Typography, 
  Space, 
  Avatar, 
  Tag, 
  Spin,
  Empty,
  Divider,
  Collapse
} from 'antd'
import { 
  SearchOutlined, 
  FilterOutlined, 
  HeartOutlined, 
  MessageOutlined, 
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons'
import { supabase, CATEGORIES } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'

const { Title, Text } = Typography
const { Option } = Select
const { Panel } = Collapse

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
  likes_count?: number
  is_liked?: boolean
  users?: {
    full_name: string
    avatar_url?: string
  }
}

const Feed: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest')

  useEffect(() => {
    fetchProducts()
  }, [sortBy])

  useEffect(() => {
    const searchParam = searchParams.get('search')
    if (searchParam !== null) {
      setSearchQuery(searchParam)
    }
  }, [searchParams])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('products')
        .select(`
          *,
          users!products_seller_id_fkey (
            full_name,
            avatar_url
          ),
          favorites!left (
            id,
            user_id
          )
        `)
        .eq('is_active', true)
        .eq('is_sold', false)

      // Сортировка
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'oldest':
          query = query.order('created_at', { ascending: true })
          break
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
      }

      const { data, error } = await query

      if (error) throw error

      const processedData = data?.map(product => ({
        ...product,
        likes_count: product.favorites?.length || 0,
        is_liked: user ? product.favorites?.some((fav: any) => fav.user_id === user.id) : false,
        favorites: undefined
      })) || []

      setProducts(processedData)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategories.length === 0 || 
                           selectedCategories.includes(product.category)
    
    return matchesSearch && matchesCategory
  })

  const toggleLike = async (productId: string, isLiked: boolean) => {
    if (!user) {
      addNotification({
        type: 'warning',
        title: 'Требуется авторизация',
        message: 'Войдите в систему, чтобы добавлять товары в избранное'
      })
      return
    }

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', user.id)

        if (error) throw error

        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, is_liked: false, likes_count: (p.likes_count || 0) - 1 }
            : p
        ))

        addNotification({
          type: 'info',
          title: 'Удалено из избранного',
          message: 'Товар больше не в вашем списке избранного'
        })
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert([{ product_id: productId, user_id: user.id }])

        if (error) throw error

        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, is_liked: true, likes_count: (p.likes_count || 0) + 1 }
            : p
        ))

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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <Title level={2} style={{ color: '#ffffff', marginBottom: '24px' }}>
        Лента товаров
      </Title>

      {/* Фильтры */}
      <Card
        style={{
          background: '#1a1a1a',
          border: '1px solid #374151',
          borderRadius: '12px',
          marginBottom: '24px',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Поиск товаров..."
              prefix={<SearchOutlined style={{ color: '#9ca3af' }} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                background: '#2a2a2a',
                border: '1px solid #374151',
                borderRadius: '8px',
                height: window.innerWidth < 768 ? '44px' : '32px',
              }}
            />
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Select
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
              suffixIcon={sortBy.includes('asc') ? <SortAscendingOutlined /> : <SortDescendingOutlined />}
              size={window.innerWidth < 768 ? 'large' : 'middle'}
            >
              <Option value="newest">Сначала новые</Option>
              <Option value="oldest">Сначала старые</Option>
              <Option value="price_asc">Цена: по возрастанию</Option>
              <Option value="price_desc">Цена: по убыванию</Option>
            </Select>
          </Col>

          <Col xs={24} md={8}>
            <Collapse ghost>
              <Panel 
                header={
                  <Space>
                    <FilterOutlined />
                    <Text style={{ color: '#ffffff' }}>
                      Категории {selectedCategories.length > 0 && `(${selectedCategories.length})`}
                    </Text>
                  </Space>
                } 
                key="1"
              >
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  flexDirection: window.innerWidth < 768 ? 'column' : 'row'
                }}>
                  {CATEGORIES.map(category => (
                    <Checkbox
                      key={category}
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                      style={{ 
                        color: '#ffffff',
                        marginBottom: window.innerWidth < 768 ? '8px' : '0'
                      }}
                    >
                      {category}
                    </Checkbox>
                  ))}
                </div>
              </Panel>
            </Collapse>
          </Col>
        </Row>
      </Card>

      {/* Товары */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Spin size="large" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Empty
          description="Товары не найдены"
          style={{ margin: '64px 0' }}
        />
      ) : (
        <Row gutter={[24, 24]}>
          {filteredProducts.map((product) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={product.id}>
              <Card
                hoverable
                onClick={() => navigate(`/product/${product.id}`)}
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #374151',
                  borderRadius: '12px',
                  height: '100%',
                  cursor: 'pointer',
                }}
                bodyStyle={{ padding: '16px' }}
                cover={
                  <div 
                    style={{ height: '200px', overflow: 'hidden' }}
                    onClick={(e) => e.stopPropagation()}
                  >
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
                        background: '#2a2a2a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#9ca3af',
                      }}>
                        Нет фото
                      </div>
                    )}
                  </div>
                }
              >
                <div style={{ marginBottom: '12px' }}>
                  <Title level={4} style={{ color: '#ffffff', margin: 0, fontSize: '16px' }}>
                    {product.title}
                  </Title>
                  <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {product.category}
                  </Text>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <Text style={{ color: '#9ca3af', fontSize: '14px' }}>
                    {product.description.length > 100 
                      ? `${product.description.substring(0, 100)}...` 
                      : product.description
                    }
                  </Text>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <Tag color={getConditionColor(product.condition)}>
                    {getConditionText(product.condition)}
                  </Tag>
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <Text style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    color: '#00ff88' 
                  }}>
                    {formatPrice(product.price)}
                  </Text>
                  
                  <Space>
                    <Button
                      type="text"
                      icon={<HeartOutlined />}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleLike(product.id, product.is_liked || false)
                      }}
                      style={{
                        color: product.is_liked ? '#ff4757' : '#ffffff',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    />
                    <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {product.likes_count || 0}
                    </Text>
                    <Button
                      type="text"
                      icon={<MessageOutlined />}
                      onClick={(e) => e.stopPropagation()}
                      style={{ 
                        color: '#ffffff',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    />
                  </Space>
                </div>

                <Divider style={{ borderColor: '#374151', margin: '12px 0' }} />

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center' 
                }}>
                  <Space 
                    style={{ 
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s ease',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/profile/${product.seller_id}`)
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2a2a2a'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Avatar 
                      src={product.users?.avatar_url}
                      size="small"
                    >
                      {product.users?.full_name?.charAt(0)}
                    </Avatar>
                    <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {product.users?.full_name}
                    </Text>
                  </Space>
                  
                  <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {new Date(product.created_at).toLocaleDateString('ru-RU')}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  )
}

export default Feed