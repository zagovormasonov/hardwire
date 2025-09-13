import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Heart, MessageCircle, Share2, Eye } from 'lucide-react'

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
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          users:seller_id (
            full_name,
            avatar_url,
            email
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      setProduct(data)
    } catch (error: any) {
      console.error('ProductDetail: Error fetching product:', error)
      setError('Товар не найден')
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
        <p className="text-gray-300">Загрузка товара...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-lg mb-4">{error || 'Товар не найден'}</p>
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
        <span className="text-gray-300">{product.category}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Изображения */}
        <div className="space-y-4">
          <div className="aspect-square bg-gray-800 rounded-xl overflow-hidden">
            {product.images.length > 0 ? (
              <img
                src={product.images[currentImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                <Eye className="w-16 h-16" />
              </div>
            )}
          </div>
          
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex
                      ? 'border-green-400'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.title} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Информация о товаре */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{product.title}</h1>
            <div className="flex items-center space-x-4 text-gray-400">
              <span>{product.category}</span>
              <span>•</span>
              <span>{getConditionText(product.condition)}</span>
            </div>
          </div>

          <div className="text-4xl font-bold text-green-400">
            {formatPrice(product.price)}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Описание</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Продавец */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Продавец</h3>
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center overflow-hidden">
                {product.users?.avatar_url ? (
                  <img 
                    src={product.users.avatar_url} 
                    alt={product.users.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-black font-bold text-lg">
                    {product.users?.full_name?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>
              <div>
                <Link 
                  to={`/profile/${product.seller_id}`}
                  className="text-lg font-semibold text-white hover:text-green-400 transition-colors"
                >
                  {product.users?.full_name || 'Неизвестный'}
                </Link>
                <p className="text-gray-400 text-sm">
                  На сайте с {new Date(product.created_at).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          </div>

          {/* Действия */}
          <div className="flex space-x-4">
            <button className="btn btn-primary flex-1">
              <MessageCircle className="w-4 h-4 mr-2" />
              Написать продавцу
            </button>
            <button className="btn btn-secondary">
              <Heart className="w-4 h-4" />
            </button>
            <button className="btn btn-secondary">
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
