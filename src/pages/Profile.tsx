import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Button, 
  Input, 
  Avatar, 
  Space, 
  Statistic, 
  Spin, 
  Empty,
  Upload,
  message,
  Modal,
  Tag
} from 'antd'
import { 
  MailOutlined, 
  SaveOutlined, 
  EditOutlined, 
  InboxOutlined, 
  EyeOutlined, 
  DeleteOutlined, 
  EyeInvisibleOutlined, 
  PlusOutlined, 
  HeartOutlined,
  CameraOutlined
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

const { Title, Text, Paragraph } = Typography
const { confirm } = Modal

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
}

// Тип для избранных товаров
interface Favorite {
  id: string
  product_id: string
  user_id: string
  created_at: string
  products?: Product
}

interface UserStats {
  total_products: number
  active_products: number
  sold_products: number
  total_views: number
}

const Profile: React.FC = () => {
  const { user, updateProfile } = useAuth()
  const { addNotification } = useNotifications()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || ''
  })
  const [loading, setLoading] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  const [products, setProducts] = useState<Product[]>([])
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [stats, setStats] = useState<UserStats>({
    total_products: 0,
    active_products: 0,
    sold_products: 0,
    total_views: 0
  })
  const [productsLoading, setProductsLoading] = useState(true)
  const [favoritesLoading, setFavoritesLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserProducts()
      fetchUserFavorites()
    }
  }, [user])

  const fetchUserProducts = async () => {
    if (!user) return
    
    try {
      setProductsLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])

      // Подсчитываем статистику
      const totalProducts = data?.length || 0
      const activeProducts = data?.filter(p => p.is_active && !p.is_sold).length || 0
      const soldProducts = data?.filter(p => p.is_sold).length || 0

      setStats({
        total_products: totalProducts,
        active_products: activeProducts,
        sold_products: soldProducts,
        total_views: 0 // Пока не реализовано
      })
    } catch (error) {
    } finally {
      setProductsLoading(false)
    }
  }

  const fetchUserFavorites = async () => {
    if (!user) return
    
    try {
      setFavoritesLoading(true)
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          *,
          products (
            id,
            title,
            description,
            price,
            category,
            condition,
            images,
            seller_id,
            created_at,
            updated_at,
            is_sold,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setFavorites(data || [])
    } catch (error) {
    } finally {
      setFavoritesLoading(false)
    }
  }

  const removeFromFavorites = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId)

      if (error) throw error

      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId))
      
      addNotification({
        type: 'info',
        title: 'Удалено из избранного',
        message: 'Товар больше не в вашем списке избранного'
      })
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Ошибка',
        message: 'Не удалось удалить товар из избранного'
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleAvatarUpload = async (file: any) => {
    if (!user) return false

    if (file.size > 5 * 1024 * 1024) {
      message.error('Размер файла не должен превышать 5MB')
      return false
    }

    if (!file.type.startsWith('image/')) {
      message.error('Выберите изображение (JPG, PNG, GIF)')
      return false
    }

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { cacheControl: '3600', upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)

      await updateProfile({ avatar_url: data.publicUrl })

      addNotification({ type: 'success', title: 'Аватар обновлен', message: 'Ваш аватар успешно загружен' })
      return false // Предотвращаем автоматическую загрузку
    } catch (error: any) {
      addNotification({ type: 'error', title: 'Ошибка загрузки', message: error.message || 'Не удалось загрузить аватар' })
      return false
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)

    try {
      await updateProfile(formData)
      setIsEditing(false)
      message.success('Профиль обновлен')
    } catch (error: any) {
      message.error(error.message || 'Ошибка обновления профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setFormData({
      full_name: user?.full_name || ''
    })
  }

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId)

      if (error) throw error

      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, is_active: !isActive } : p
      ))

      // Обновляем статистику
      const newActiveCount = isActive ? stats.active_products - 1 : stats.active_products + 1
      setStats({ ...stats, active_products: newActiveCount })
    } catch (error) {
      message.error('Ошибка изменения статуса товара')
    }
  }

  const deleteProduct = async (productId: string) => {
    confirm({
      title: 'Удалить товар?',
      content: 'Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.',
      okText: 'Удалить',
      okType: 'danger',
      cancelText: 'Отмена',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId)

          if (error) throw error

          const deletedProduct = products.find(p => p.id === productId)
          setProducts(prev => prev.filter(p => p.id !== productId))

          // Обновляем статистику
          setStats({
            total_products: stats.total_products - 1,
            active_products: deletedProduct?.is_active ? stats.active_products - 1 : stats.active_products,
            sold_products: deletedProduct?.is_sold ? stats.sold_products - 1 : stats.sold_products,
            total_views: stats.total_views
          })

          message.success('Товар удален')
        } catch (error) {
          message.error('Ошибка удаления товара')
        }
      }
    })
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

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <Empty description="Пользователь не найден" />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 0' }}>
      {/* Заголовок */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
          Личный кабинет
        </Title>
        <Paragraph style={{ color: '#9ca3af', fontSize: '16px', margin: 0 }}>
          Управляй своими данными и товарами
        </Paragraph>
      </div>

      {/* Карточка профиля */}
      <Card
        style={{
          background: '#1a1a1a',
          border: '1px solid #374151',
          borderRadius: '16px',
          marginBottom: '32px',
          height: '290px',
        }}
        bodyStyle={{ padding: '32px', height: '100%', display: 'flex', alignItems: 'center' }}
      >
        <Row gutter={[32, 32]} style={{ width: '100%' }}>
          <Col xs={24} md={8} style={{ textAlign: 'center' }}>
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <Avatar
                size={120}
                src={user.avatar_url}
                style={{
                  background: 'linear-gradient(135deg, #00ff88 0%, #00cc6a 100%)',
                  color: '#000',
                  fontSize: '48px',
                  fontWeight: 'bold',
                }}
              >
                {user.full_name.charAt(0).toUpperCase()}
              </Avatar>
              {isEditing && (
                <Upload
                  beforeUpload={handleAvatarUpload}
                  showUploadList={false}
                  accept="image/*"
                >
                  <Button
                    type="primary"
                    shape="circle"
                    icon={<CameraOutlined />}
                    size="small"
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      background: '#00ff88',
                      borderColor: '#00ff88',
                      color: '#000',
                    }}
                    loading={uploadingAvatar}
                  />
                </Upload>
              )}
            </div>
          </Col>
          
          <Col xs={24} md={16}>
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ marginBottom: '16px' }}>
                <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Полное имя</Text>
                {isEditing ? (
                  <Input
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    style={{
                      background: '#2a2a2a',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      marginTop: '4px',
                    }}
                  />
                ) : (
                  <Title level={4} style={{ color: '#ffffff', margin: '4px 0 0 0' }}>
                    {user.full_name}
                  </Title>
                )}
              </div>

              <div style={{ marginBottom: '16px' }}>
                <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Email</Text>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                  <MailOutlined style={{ color: '#9ca3af', marginRight: '8px' }} />
                  <Text style={{ color: '#ffffff' }}>{user.email}</Text>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Дата регистрации</Text>
                <Text style={{ color: '#ffffff', display: 'block', marginTop: '4px' }}>
                  {new Date(user.created_at).toLocaleDateString('ru-RU')}
                </Text>
              </div>

              <div>
                {isEditing ? (
                  <Space>
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      onClick={handleSave}
                      loading={loading}
                      style={{
                        background: '#00ff88',
                        borderColor: '#00ff88',
                        color: '#000',
                      }}
                    >
                      Сохранить
                    </Button>
                    <Button onClick={handleCancel}>
                      Отмена
                    </Button>
                  </Space>
                ) : (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={() => setIsEditing(true)}
                    style={{
                      background: '#00ff88',
                      borderColor: '#00ff88',
                      color: '#000',
                    }}
                  >
                    Редактировать
                  </Button>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Статистика */}
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
              value={stats.total_products}
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
              value={stats.active_products}
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
              value={stats.sold_products}
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
              title={<Text style={{ color: '#9ca3af' }}>Просмотров</Text>}
              value={stats.total_views}
              valueStyle={{ color: '#00ff88' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Мои товары */}
      <Card
        style={{
          background: '#1a1a1a',
          border: '1px solid #374151',
          borderRadius: '16px',
          marginBottom: '32px',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ color: '#ffffff', margin: 0 }}>
            Мои товары
          </Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            style={{
              background: '#00ff88',
              borderColor: '#00ff88',
              color: '#000',
            }}
          >
            <Link to="/create" style={{ color: '#000' }}>Добавить товар</Link>
          </Button>
        </div>

        {productsLoading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Spin size="large" />
          </div>
        ) : products.length === 0 ? (
          <Empty description="У вас пока нет товаров" />
        ) : (
          <Row gutter={[16, 16]}>
            {products.map((product) => (
              <Col xs={24} sm={12} lg={8} key={product.id}>
                <Card
                  hoverable
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    height: '100%',
                  }}
                  bodyStyle={{ padding: '16px' }}
                  cover={
                    <div style={{ height: '150px', overflow: 'hidden' }}>
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

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Space>
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        size="small"
                        style={{ 
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Link to={`/product/${product.id}`}>Просмотр</Link>
                      </Button>
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                        style={{ 
                          color: '#00ff88',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Link to={`/edit/${product.id}`}>Редактировать</Link>
                      </Button>
                    </Space>
                    
                    <Space>
                      <Button
                        type="text"
                        icon={product.is_active ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        size="small"
                        style={{ 
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                      />
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        size="small"
                        style={{ 
                          color: '#ff4757',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onClick={() => deleteProduct(product.id)}
                      />
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* Избранные товары */}
      <Card
        style={{
          background: '#1a1a1a',
          border: '1px solid #374151',
          borderRadius: '16px',
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ color: '#ffffff', margin: 0 }}>
            Избранное
          </Title>
          <Text style={{ color: '#9ca3af' }}>
            {favorites.length} товаров
          </Text>
        </div>

        {favoritesLoading ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <Spin size="large" />
          </div>
        ) : favorites.length === 0 ? (
          <Empty description="У вас пока нет избранных товаров" />
        ) : (
          <Row gutter={[16, 16]}>
            {favorites.map((favorite) => (
              <Col xs={24} sm={12} lg={8} key={favorite.id}>
                <Card
                  hoverable
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '12px',
                    height: '100%',
                  }}
                  bodyStyle={{ padding: '16px' }}
                  cover={
                    <div style={{ height: '150px', overflow: 'hidden' }}>
                      {favorite.products?.images && favorite.products.images.length > 0 ? (
                        <img
                          alt={favorite.products.title}
                          src={favorite.products.images[0]}
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
                      {favorite.products?.title || 'Товар удален'}
                    </Title>
                    <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {favorite.products?.category} • {getConditionText(favorite.products?.condition || '')}
                    </Text>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#00ff88' }}>
                      {favorite.products?.price ? formatPrice(favorite.products.price) : 'Цена не указана'}
                    </Text>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                      type="text"
                      icon={<HeartOutlined />}
                      size="small"
                      style={{ 
                        color: '#ff4757',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onClick={() => removeFromFavorites(favorite.id)}
                    />
                    
                    {favorite.products && (
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        style={{
                          background: '#00ff88',
                          borderColor: '#00ff88',
                          color: '#000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Link to={`/product/${favorite.products.id}`} style={{ color: '#000' }}>
                          Перейти к товару
                        </Link>
                      </Button>
                    )}
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

export default Profile