import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { supabase } from '../lib/supabase'
import { Mail, Camera, Save, Edit3, Package, Eye, Trash2, EyeOff, Plus, Edit, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'

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
  const [error, setError] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  
  // Новые состояния для товаров и статистики
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
      
      // Подсчет статистики
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
      console.error('Profile: Error fetching products:', error)
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
      console.error('Profile: Error fetching favorites:', error)
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

      // Обновляем локальное состояние
      setFavorites(prev => prev.filter(fav => fav.id !== favoriteId))
      
      addNotification({
        type: 'info',
        title: 'Удалено из избранного',
        message: 'Товар больше не в вашем списке избранного'
      })
    } catch (error) {
      console.error('Profile: Error removing from favorites:', error)
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Проверяем размер файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      addNotification({
        type: 'error',
        title: 'Файл слишком большой',
        message: 'Размер файла не должен превышать 5MB'
      })
      return
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      addNotification({
        type: 'error',
        title: 'Неверный формат файла',
        message: 'Выберите изображение (JPG, PNG, GIF)'
      })
      return
    }

    setUploadingAvatar(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Обновляем профиль пользователя через updateProfile
      await updateProfile({
        avatar_url: data.publicUrl
      })

      addNotification({
        type: 'success',
        title: 'Аватар обновлен',
        message: 'Ваш аватар успешно загружен'
      })
    } catch (error: any) {
      console.error('Profile: Avatar upload error:', error)
      addNotification({
        type: 'error',
        title: 'Ошибка загрузки',
        message: error.message || 'Не удалось загрузить аватар'
      })
    } finally {
      setUploadingAvatar(false)
      // Очищаем input
      e.target.value = ''
    }
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')

    try {
      await updateProfile(formData)
      setIsEditing(false)
    } catch (error: any) {
      console.error('Profile: Update error:', error)
      setError(error.message || 'Ошибка обновления профиля')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      full_name: user?.full_name || ''
    })
    setIsEditing(false)
    setError('')
  }

  const toggleProductStatus = async (productId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !isActive })
        .eq('id', productId)

      if (error) throw error

      // Обновляем локальное состояние
      setProducts(products.map(p => 
        p.id === productId ? { ...p, is_active: !isActive } : p
      ))

      // Обновляем статистику
      const newActiveCount = isActive ? stats.active_products - 1 : stats.active_products + 1
      setStats({ ...stats, active_products: newActiveCount })
    } catch (error) {
      console.error('Profile: Error toggling product status:', error)
      setError('Ошибка изменения статуса товара')
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      // Обновляем локальное состояние
      const deletedProduct = products.find(p => p.id === productId)
      setProducts(products.filter(p => p.id !== productId))

      // Обновляем статистику
      setStats({
        total_products: stats.total_products - 1,
        active_products: deletedProduct?.is_active ? stats.active_products - 1 : stats.active_products,
        sold_products: deletedProduct?.is_sold ? stats.sold_products - 1 : stats.sold_products,
        total_views: stats.total_views
      })
    } catch (error) {
      console.error('Profile: Error deleting product:', error)
      setError('Ошибка удаления товара')
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

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-300 text-lg">Пользователь не найден</p>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Профиль пользователя
        </h1>
        <p className="text-gray-400">
          Управляй своими данными и товарами
        </p>
      </div>

      {/* Карточка профиля */}
      <div className="card max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Аватар */}
          <div className="relative">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center overflow-hidden">
              {user?.avatar_url ? (
                <img 
                  src={user.avatar_url} 
                  alt={user.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-black font-bold text-2xl md:text-4xl">
                  {user?.full_name?.charAt(0).toUpperCase() || '?'}
                </span>
              )}
            </div>
            {isEditing && (
              <div className="absolute bottom-0 right-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={uploadingAvatar}
                />
                <label
                  htmlFor="avatar-upload"
                  className="bg-green-400 text-black rounded-full p-1.5 md:p-2 hover:bg-blue-400 transition-colors cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-black"></div>
                  ) : (
                    <Camera className="w-3 h-3 md:w-4 md:h-4" />
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="flex-1 space-y-6">
            {/* Имя */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Полное имя
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="Введите ваше имя"
                />
              ) : (
                <p className="text-white text-lg font-medium">
                  {user.full_name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="text-gray-300">
                  {user.email}
                </p>
              </div>
            </div>

            {/* Дата регистрации */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Дата регистрации
              </label>
              <p className="text-gray-300">
                {new Date(user.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Кнопки */}
            <div className="flex space-x-4">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn btn-secondary"
                  >
                    Отмена
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-primary"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Редактировать
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <div className="card text-center">
          <div className="text-xl md:text-2xl font-bold text-green-400 mb-2">{stats.total_products}</div>
          <div className="text-gray-400 text-sm md:text-base">Всего товаров</div>
        </div>
        <div className="card text-center">
          <div className="text-xl md:text-2xl font-bold text-blue-400 mb-2">{stats.active_products}</div>
          <div className="text-gray-400 text-sm md:text-base">Активных</div>
        </div>
        <div className="card text-center">
          <div className="text-xl md:text-2xl font-bold text-purple-400 mb-2">{stats.sold_products}</div>
          <div className="text-gray-400 text-sm md:text-base">Проданных</div>
        </div>
        <div className="card text-center">
          <div className="text-xl md:text-2xl font-bold text-yellow-400 mb-2">{stats.total_views}</div>
          <div className="text-gray-400 text-sm md:text-base">Просмотров</div>
        </div>
      </div>

      {/* Мои товары */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Мои товары</h2>
          <Link to="/create" className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Добавить товар
          </Link>
        </div>

        {productsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
            <p className="text-gray-400">Загрузка товаров...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">У вас пока нет товаров</p>
            <Link to="/create" className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Создать первый товар
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="card group">
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
                      <Package className="w-12 h-12" />
                    </div>
                  )}
                </div>

                {/* Информация */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white line-clamp-2">
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
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      product.is_sold 
                        ? 'bg-red-500/20 text-red-400' 
                        : product.is_active 
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {product.is_sold ? 'Продано' : product.is_active ? 'Активно' : 'Скрыто'}
                    </div>
                  </div>

                  {/* Действия */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-600">
                    <Link 
                      to={`/product/${product.id}`}
                      className="flex-1 btn btn-secondary text-center flex items-center justify-center"
                      title="Просмотр товара"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <div className="flex gap-2">
                      <Link 
                        to={`/edit/${product.id}`}
                        className="btn btn-secondary text-blue-400 hover:text-blue-300 flex items-center justify-center"
                        title="Редактировать товар"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => toggleProductStatus(product.id, product.is_active)}
                        className="btn btn-secondary flex items-center justify-center"
                        title={product.is_active ? 'Скрыть товар' : 'Показать товар'}
                      >
                        {product.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="btn btn-secondary text-red-400 hover:text-red-300 flex items-center justify-center"
                        title="Удалить товар"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Избранные товары */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Избранное</h2>
          <div className="text-sm text-gray-400">
            {favorites.length} товаров
          </div>
        </div>

        {favoritesLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
            <p className="text-gray-400 mt-2">Загрузка избранного...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">У вас пока нет избранных товаров</p>
            <p className="text-gray-500 text-sm mt-2">
              Нажмите на сердечко у товара, чтобы добавить его в избранное
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((favorite) => (
              <div key={favorite.id} className="card group">
                {/* Изображение */}
                <div className="aspect-square bg-gray-800 rounded-lg mb-4 overflow-hidden">
                  {favorite.products?.images && favorite.products.images.length > 0 ? (
                    <img
                      src={favorite.products.images[0]}
                      alt={favorite.products.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Информация */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-green-400 transition-colors line-clamp-2">
                      {favorite.products?.title || 'Товар удален'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {favorite.products?.category} • {favorite.products?.condition === 'new' ? 'Новый' : favorite.products?.condition === 'used' ? 'Б/У' : 'Восстановленный'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-green-400">
                      {favorite.products?.price ? `${favorite.products.price.toLocaleString()} ₽` : 'Цена не указана'}
                    </span>
                    <button
                      onClick={() => removeFromFavorites(favorite.id)}
                      className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition-all duration-300 flex items-center justify-center"
                      title="Удалить из избранного"
                    >
                      <Heart className="w-4 h-4 fill-red-400" />
                    </button>
                  </div>
                </div>

                {/* Ссылка на товар */}
                {favorite.products && (
                  <div className="pt-2 border-t border-gray-600">
                    <Link
                      to={`/product/${favorite.products.id}`}
                      className="btn btn-secondary w-full text-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Перейти к товару
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile