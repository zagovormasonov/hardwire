import React, { useState, useEffect } from 'react'
import { Card, Row, Col, Typography, Button, Spin, Empty, message } from 'antd'
import { 
  BellOutlined, 
  BellFilled, 
  DesktopOutlined, 
  HddOutlined, 
  MonitorOutlined, 
  ThunderboltOutlined, 
  DatabaseOutlined, 
  FireOutlined, 
  MoreOutlined, 
  AudioOutlined 
} from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase, CATEGORIES } from '../lib/supabase'

const { Title, Text } = Typography

// Типы для подписок
interface Subscription {
  id: string
  user_id: string
  category: string
  created_at: string
}

const Categories: React.FC = () => {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSubscriptions()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchSubscriptions = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      setSubscriptions(data || [])
    } catch (error) {
      message.error('Ошибка загрузки подписок')
    } finally {
      setLoading(false)
    }
  }

  const toggleSubscription = async (category: string) => {
    if (!user) {
      message.warning('Войдите в систему, чтобы подписываться на категории')
      return
    }

    const existingSubscription = subscriptions.find(sub => sub.category === category)

    try {
      if (existingSubscription) {
        // Отписываемся
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('id', existingSubscription.id)

        if (error) throw error

        setSubscriptions(prev => prev.filter(sub => sub.id !== existingSubscription.id))
        message.success(`Отписались от категории "${category}"`)
      } else {
        // Подписываемся
        const { error } = await supabase
          .from('subscriptions')
          .insert([{ user_id: user.id, category }])

        if (error) throw error

        const newSubscription = {
          id: Date.now().toString(),
          user_id: user.id,
          category,
          created_at: new Date().toISOString()
        }

        setSubscriptions(prev => [...prev, newSubscription])
        message.success(`Подписались на категорию "${category}"`)
      }
    } catch (error) {
      message.error('Ошибка изменения подписки')
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Процессоры':
        return <DesktopOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      case 'Видеокарты':
        return <MonitorOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      case 'Материнские платы':
        return <HddOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      case 'Оперативная память':
        return <DatabaseOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      case 'Накопители':
        return <HddOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      case 'Блоки питания':
        return <ThunderboltOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      case 'Корпуса':
        return <DesktopOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      case 'Охлаждение':
        return <FireOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      case 'Периферия':
        return <MoreOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      case 'Другое':
        return <AudioOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
      default:
        return <DesktopOutlined style={{ fontSize: '32px', color: '#00ff88' }} />
    }
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'Процессоры':
        return 'Intel, AMD - все процессоры для вашей сборки'
      case 'Видеокарты':
        return 'RTX, GTX, RX - мощные видеокарты'
      case 'Материнские платы':
        return 'Основа вашего ПК - материнские платы'
      case 'Оперативная память':
        return 'DDR4, DDR5 - быстрая память'
      case 'Накопители':
        return 'SSD, HDD - хранилища данных'
      case 'Блоки питания':
        return 'Надежные источники питания'
      case 'Корпуса':
        return 'Стильные корпуса для ПК'
      case 'Охлаждение':
        return 'Кулеры, радиаторы, термопаста'
      case 'Периферия':
        return 'Мыши, клавиатуры, мониторы'
      case 'Другое':
        return 'Прочие комплектующие'
      default:
        return 'Комплектующие для ПК'
    }
  }

  const isSubscribed = (category: string) => {
    return subscriptions.some(sub => sub.category === category)
  }

  if (!user) {
    return (
      <div style={{ padding: '24px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
            Категории товаров
          </Title>
          <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
            Подписывайтесь на интересующие вас категории
          </Text>
        </div>
        
        <Empty 
          description="Войдите в систему, чтобы подписываться на категории"
          style={{ margin: '64px 0' }}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
          Категории товаров
        </Title>
        <Text style={{ color: '#9ca3af', fontSize: '16px' }}>
          Подписывайтесь на интересующие вас категории и получайте уведомления о новых товарах
        </Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {CATEGORIES.map((category) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={category}>
              <Card
                hoverable
                style={{
                  background: '#1a1a1a',
                  border: '1px solid #374151',
                  borderRadius: '16px',
                  height: '100%',
                  position: 'relative',
                }}
                bodyStyle={{ 
                  padding: '24px',
                  textAlign: 'center',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    {getCategoryIcon(category)}
                  </div>
                  
                  <Title level={4} style={{ color: '#ffffff', marginBottom: '8px' }}>
                    {category}
                  </Title>
                  
                  <Text style={{ color: '#9ca3af', fontSize: '14px' }}>
                    {getCategoryDescription(category)}
                  </Text>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <Button
                    type={isSubscribed(category) ? 'default' : 'primary'}
                    icon={isSubscribed(category) ? <BellFilled /> : <BellOutlined />}
                    onClick={() => toggleSubscription(category)}
                    style={{
                      width: '100%',
                      background: isSubscribed(category) ? 'transparent' : '#00ff88',
                      borderColor: isSubscribed(category) ? '#374151' : '#00ff88',
                      color: isSubscribed(category) ? '#ffffff' : '#000',
                    }}
                  >
                    {isSubscribed(category) ? 'Отписаться' : 'Подписаться'}
                  </Button>
                </div>

                {isSubscribed(category) && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#00ff88',
                    borderRadius: '50%',
                    width: '8px',
                    height: '8px',
                  }} />
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {subscriptions.length > 0 && (
        <Card
          style={{
            background: '#1a1a1a',
            border: '1px solid #374151',
            borderRadius: '16px',
            marginTop: '32px',
          }}
          bodyStyle={{ padding: '24px' }}
        >
          <Title level={3} style={{ color: '#ffffff', marginBottom: '16px' }}>
            Ваши подписки ({subscriptions.length})
          </Title>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {subscriptions.map((subscription) => (
              <Button
                key={subscription.id}
                type="default"
                icon={<BellFilled />}
                onClick={() => toggleSubscription(subscription.category)}
                style={{
                  background: 'transparent',
                  borderColor: '#00ff88',
                  color: '#00ff88',
                }}
              >
                {subscription.category}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default Categories