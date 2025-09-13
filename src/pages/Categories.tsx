import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase, CATEGORIES } from '../lib/supabase'
import { Bell, BellOff, Cpu, HardDrive, Monitor, Zap, Database, Thermometer, Mouse, Headphones } from 'lucide-react'

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
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      setSubscriptions(data || [])
    } catch (error) {
      console.error('Categories: Error fetching subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSubscription = async (category: string) => {
    if (!user) return

    const isSubscribed = subscriptions.some(sub => sub.category === category)

    try {
      if (isSubscribed) {
        // Отписаться
        const { error } = await supabase
          .from('subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('category', category)

        if (error) throw error

        setSubscriptions(prev => prev.filter(sub => sub.category !== category))
      } else {
        // Подписаться
        const { error } = await supabase
          .from('subscriptions')
          .insert([{
            user_id: user.id,
            category: category
          }])

        if (error) throw error

        setSubscriptions(prev => [...prev, {
          id: '',
          user_id: user.id,
          category: category,
          created_at: new Date().toISOString()
        }])
      }
    } catch (error) {
      console.error('Categories: Error toggling subscription:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Процессоры': return <Cpu className="w-8 h-8" />
      case 'Видеокарты': return <HardDrive className="w-8 h-8" />
      case 'Материнские платы': return <Monitor className="w-8 h-8" />
      case 'Оперативная память': return <Database className="w-8 h-8" />
      case 'Накопители': return <HardDrive className="w-8 h-8" />
      case 'Блоки питания': return <Zap className="w-8 h-8" />
      case 'Корпуса': return <Monitor className="w-8 h-8" />
      case 'Охлаждение': return <Thermometer className="w-8 h-8" />
      case 'Периферия': return <Mouse className="w-8 h-8" />
      case 'Другое': return <Headphones className="w-8 h-8" />
      default: return <Monitor className="w-8 h-8" />
    }
  }

  const getCategoryDescription = (category: string) => {
    switch (category) {
      case 'Процессоры': return 'Intel, AMD - все процессоры для вашей сборки'
      case 'Видеокарты': return 'RTX, GTX, RX - игровые и профессиональные карты'
      case 'Материнские платы': return 'Основа вашего ПК - от бюджетных до топовых'
      case 'Оперативная память': return 'DDR4, DDR5 - быстрая память для любых задач'
      case 'Накопители': return 'SSD, HDD, NVMe - хранилища всех типов'
      case 'Блоки питания': return 'Надежные БП для стабильной работы системы'
      case 'Корпуса': return 'Стильные корпуса для любых форм-факторов'
      case 'Охлаждение': return 'Кулеры, радиаторы, термопаста'
      case 'Периферия': return 'Клавиатуры, мыши, мониторы и аксессуары'
      case 'Другое': return 'Все остальные комплектующие и аксессуары'
      default: return 'Комплектующие для ПК'
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-neon mx-auto mb-4"></div>
        <p className="text-text-secondary">Загрузка категорий...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold text-gradient mb-2">
          Категории железа
        </h1>
        <p className="text-text-secondary">
          Подписывайся на интересующие категории и получай уведомления о новых товарах
        </p>
      </div>

      {/* Информация о подписках */}
      {user && (
        <div className="card bg-gradient-to-r from-primary-neon/10 to-accent-neon/10 border-primary-neon/20">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-primary-neon" />
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Управление подписками
              </h3>
              <p className="text-text-secondary">
                Подписан на {subscriptions.length} категорий. Новые товары будут отображаться в ленте.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Сетка категорий */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CATEGORIES.map((category) => {
          const isSubscribed = subscriptions.some(sub => sub.category === category)
          
          return (
            <div key={category} className="card group hover:scale-105 transition-transform duration-300">
              <div className="space-y-4">
                {/* Иконка и название */}
                <div className="flex items-center justify-between">
                  <div className="text-primary-neon group-hover:text-accent-neon transition-colors">
                    {getCategoryIcon(category)}
                  </div>
                  
                  {user && (
                    <button
                      onClick={() => toggleSubscription(category)}
                      className={`p-2 rounded-lg transition-colors ${
                        isSubscribed
                          ? 'bg-primary-neon text-bg-dark hover:bg-accent-neon'
                          : 'bg-bg-card-hover text-text-muted hover:text-primary-neon hover:bg-primary-neon/10'
                      }`}
                      title={isSubscribed ? 'Отписаться' : 'Подписаться'}
                    >
                      {isSubscribed ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {/* Название и описание */}
                <div>
                  <h3 className="text-xl font-semibold text-text-primary mb-2">
                    {category}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {getCategoryDescription(category)}
                  </p>
                </div>

                {/* Статус подписки */}
                {user && (
                  <div className="pt-2 border-t border-border-subtle">
                    <div className={`flex items-center space-x-2 text-sm ${
                      isSubscribed ? 'text-primary-neon' : 'text-text-muted'
                    }`}>
                      <Bell className="w-4 h-4" />
                      <span>
                        {isSubscribed ? 'Подписан' : 'Не подписан'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Информация для неавторизованных */}
      {!user && (
        <div className="text-center py-8">
          <div className="card max-w-md mx-auto bg-gradient-to-r from-secondary-neon/10 to-warning-neon/10 border-secondary-neon/20">
            <Bell className="w-12 h-12 text-secondary-neon mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              Войдите в систему
            </h3>
            <p className="text-text-secondary mb-4">
              Чтобы подписываться на категории и получать уведомления о новых товарах
            </p>
            <div className="flex space-x-4 justify-center">
              <a href="/login" className="btn btn-primary">
                Войти
              </a>
              <a href="/register" className="btn btn-secondary">
                Регистрация
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Categories
