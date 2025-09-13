import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Package, Eye } from 'lucide-react'

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
  const [seller, setSeller] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
    } catch (error: any) {
      console.error('SellerProfile: Error fetching data:', error)
      setError('Продавец не найден')
    } finally {
      setLoading(false)
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400 mx-auto mb-4"></div>
        <p className="text-gray-300">Загрузка профиля...</p>
      </div>
    )
  }

  if (error || !seller) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-lg mb-4">{error || 'Продавец не найден'}</p>
        <Link to="/feed" className="btn btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться к ленте
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Навигация */}
      <div className="flex items-center space-x-4">
        <Link to="/feed" className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к ленте
        </Link>
        <span className="text-gray-400">/</span>
        <span className="text-gray-300">Профиль продавца</span>
      </div>

      {/* Информация о продавце */}
      <div className="card max-w-2xl mx-auto">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Аватар */}
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center overflow-hidden">
            {seller.avatar_url ? (
              <img 
                src={seller.avatar_url} 
                alt={seller.full_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-black font-bold text-2xl md:text-4xl">
                {seller.full_name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Информация */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {seller.full_name}
              </h1>
              <p className="text-gray-400">
                На сайте с {new Date(seller.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-green-400">{products.length}</div>
                <div className="text-gray-400 text-sm md:text-base">Товаров на продажу</div>
              </div>
              <div className="text-center">
                <div className="text-xl md:text-2xl font-bold text-blue-400">0</div>
                <div className="text-gray-400 text-sm md:text-base">Проданных</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Товары продавца */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Товары продавца</h2>
          <span className="text-gray-400">{products.length} товаров</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">У продавца пока нет активных товаров</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="card group">
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
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default SellerProfile
