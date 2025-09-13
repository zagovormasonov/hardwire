import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase, CATEGORIES } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { ArrowLeft, Upload, X, Save } from 'lucide-react'

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

const EditProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'new' as 'new' | 'used' | 'refurbished'
  })
  
  const [images, setImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      // Проверяем, что товар принадлежит текущему пользователю
      if (data.seller_id !== user?.id) {
        setError('У вас нет прав для редактирования этого товара')
        return
      }

      setProduct(data)
      setFormData({
        title: data.title,
        description: data.description,
        price: data.price.toString(),
        category: data.category,
        condition: data.condition
      })
      setImages(data.images || [])
    } catch (error: any) {
      console.error('EditProduct: Error fetching product:', error)
      setError('Товар не найден')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || !user) return

    setUploadingImages(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath)

        return data.publicUrl
      })

      const newImageUrls = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...newImageUrls])
    } catch (error) {
      console.error('EditProduct: Image upload error:', error)
      setError('Ошибка загрузки изображений')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Введите название товара')
      return
    }
    
    if (!formData.description.trim()) {
      setError('Введите описание товара')
      return
    }
    
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError('Введите корректную цену')
      return
    }
    
    if (!formData.category) {
      setError('Выберите категорию')
      return
    }
    
    if (images.length === 0) {
      setError('Добавьте хотя бы одно изображение')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          price: parseFloat(formData.price),
          category: formData.category,
          condition: formData.condition,
          images: images,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      navigate('/profile')
    } catch (error: any) {
      console.error('EditProduct: Update error:', error)
      setError(error.message || 'Ошибка обновления товара')
    } finally {
      setSaving(false)
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

  if (error && !product) {
    return (
      <div className="text-center py-16">
        <p className="text-red-400 text-lg mb-4">{error}</p>
        <button onClick={() => navigate('/profile')} className="btn btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Вернуться к профилю
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Навигация */}
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate('/profile')} className="btn btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Назад к профилю
        </button>
        <span className="text-gray-400">/</span>
        <span className="text-gray-300">Редактирование товара</span>
      </div>

      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">
          Редактирование товара
        </h1>
        <p className="text-gray-400">
          Измените информацию о вашем товаре
        </p>
      </div>

      {/* Форма */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Название */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Название товара *
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input w-full"
            placeholder="Введите название товара"
            required
          />
        </div>

        {/* Описание */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Описание *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input w-full h-32 resize-none"
            placeholder="Подробно опишите товар..."
            required
          />
        </div>

        {/* Цена и категория */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Цена (₽) *
            </label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="input w-full"
              placeholder="0"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Категория *
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="input w-full"
              required
            >
              <option value="">Выберите категорию</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Состояние */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Состояние товара
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'new', label: 'Новое' },
              { value: 'used', label: 'Б/У' },
              { value: 'refurbished', label: 'Восстановленное' }
            ].map(option => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="condition"
                  value={option.value}
                  checked={formData.condition === option.value}
                  onChange={handleChange}
                  className="w-4 h-4 text-green-400 bg-gray-800 border-gray-600 focus:ring-green-400 focus:ring-2"
                />
                <span className="text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Изображения */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Изображения *
          </label>
          
          {/* Загрузка новых изображений */}
          <div className="mb-4">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
              disabled={uploadingImages}
            />
            <label
              htmlFor="image-upload"
              className="btn btn-secondary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingImages ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {uploadingImages ? 'Загрузка...' : 'Добавить изображения'}
            </label>
          </div>

          {/* Список изображений */}
          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Изображение ${index + 1}`}
                    className="w-full h-24 md:h-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-2 h-2 md:w-3 md:h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить изменения'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="btn btn-secondary"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditProduct
