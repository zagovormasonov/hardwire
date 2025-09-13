import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase, CATEGORIES } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { Search, Filter, Heart, MessageCircle, Eye } from 'lucide-react'

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
  const { user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price_asc' | 'price_desc'>('newest')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [sortBy])

  useEffect(() => {
    // Обновляем поисковый запрос при изменении URL параметров
    const searchParam = searchParams.get('search')
    if (searchParam !== null) {
      setSearchQuery(searchParam)
    }
  }, [searchParams])

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          users:seller_id (
            full_name,
            avatar_url
          ),
          favorites!left (
            id,
            user_id
          )
        `)
        .eq('is_sold', false)
        .eq('is_active', true)

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

      // Обрабатываем данные для добавления информации о лайках
      const processedData = data?.map(product => {
        const likes_count = product.favorites?.length || 0
        const is_liked = user ? product.favorites?.some((fav: any) => fav.user_id === user.id) : false
        
        return {
          ...product,
          likes_count,
          is_liked,
          favorites: undefined // Убираем массив favorites из результата
        }
      }) || []

      setProducts(processedData)
    } catch (error) {
      console.error('Feed: Error fetching products:', error)
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

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleLike = async (productId: string, isLiked: boolean) => {
    if (!user) {
      alert('Войдите в систему, чтобы добавлять товары в избранное')
      return
    }

    try {
      if (isLiked) {
        // Удаляем из избранного
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('product_id', productId)
          .eq('user_id', user.id)

        if (error) throw error

        // Обновляем локальное состояние
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, is_liked: false, likes_count: (p.likes_count || 0) - 1 }
            : p
        ))
      } else {
        // Добавляем в избранное
        const { error } = await supabase
          .from('favorites')
          .insert([{
            product_id: productId,
            user_id: user.id
          }])

        if (error) throw error

        // Обновляем локальное состояние
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, is_liked: true, likes_count: (p.likes_count || 0) + 1 }
            : p
        ))
      }
    } catch (error) {
      console.error('Feed: Error toggling like:', error)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price) + ' ₽'
  }

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'new': return 'Новое'
      case 'used': return 'Б/У'
      case 'refurbished': return 'Восстановленное'
      default: return condition
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-neon mx-auto mb-4"></div>
        <p className="text-text-secondary">Загрузка товаров...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold text-gradient mb-2">
          Лента товаров
        </h1>
        <p className="text-text-secondary">
          Найди идеальное железо для своей сборки
        </p>
      </div>

      {/* Поиск и фильтры */}
      <div className="card">
        <div className="space-y-4">
          {/* Поиск */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Поиск по названию или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          {/* Сортировка и фильтры */}
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input flex-1"
            >
              <option value="newest">Новые</option>
              <option value="oldest">Старые</option>
              <option value="price_asc">Цена ↑</option>
              <option value="price_desc">Цена ↓</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-secondary flex items-center justify-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Фильтры
            </button>
          </div>
        </div>

        {/* Фильтры по категориям */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-600">
            <h3 className="text-lg font-semibold text-white mb-4">Категории</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
              {CATEGORIES.map(category => (
                <label key={category} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 text-green-400 bg-gray-800 border-gray-600 rounded focus:ring-green-400 focus:ring-2"
                  />
                  <span className="text-gray-300 text-sm font-medium">{category}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Результаты */}
      <div className="text-center mb-6">
        <p className="text-text-secondary">
          Найдено товаров: <span className="text-primary-neon font-semibold">{filteredProducts.length}</span>
        </p>
      </div>

      {/* Сетка товаров */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-text-secondary text-lg">Товары не найдены</p>
          <p className="text-text-muted">Попробуйте изменить параметры поиска</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="card group">
              {/* Изображение и основная информация */}
              <Link to={`/product/${product.id}`} className="block">
                {/* Изображение */}
                <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Eye className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Информация */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {product.category} • {getConditionText(product.condition)}
                    </p>
                  </div>

                         <div className="flex items-center justify-between">
                           <span className="text-xl font-bold text-green-400">
                             {formatPrice(product.price)}
                           </span>
                           <div className="flex items-center space-x-2 text-gray-500">
                             <button
                               onClick={() => toggleLike(product.id, product.is_liked || false)}
                               className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${
                                 product.is_liked 
                                   ? 'text-red-400 bg-red-500/20' 
                                   : 'hover:bg-red-500/20 hover:text-red-400'
                               }`}
                               title={product.is_liked ? 'Удалить из избранного' : 'Добавить в избранное'}
                             >
                               <Heart className={`w-4 h-4 ${product.is_liked ? 'fill-current' : ''}`} />
                             </button>
                             <span className="text-xs text-gray-400">
                               {product.likes_count || 0}
                             </span>
                             <button
                               className="p-2 rounded-lg hover:bg-blue-500/20 hover:text-blue-400 transition-all duration-300 flex items-center justify-center"
                               title="Написать продавцу"
                             >
                               <MessageCircle className="w-4 h-4" />
                             </button>
                           </div>
                         </div>
                </div>
              </Link>

              {/* Продавец - отдельно от основной ссылки */}
              <div className="flex items-center space-x-2 pt-2 border-t border-gray-600">
                <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center overflow-hidden">
                  {product.users?.avatar_url ? (
                    <img 
                      src={product.users.avatar_url} 
                      alt={product.users.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-black font-bold text-xs">
                      {product.users?.full_name?.charAt(0).toUpperCase() || '?'}
                    </span>
                  )}
                </div>
                <Link 
                  to={`/profile/${product.seller_id}`}
                  className="text-sm text-gray-300 hover:text-green-400 transition-colors"
                >
                  {product.users?.full_name || 'Неизвестный'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Feed
