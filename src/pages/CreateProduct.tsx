import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase, CATEGORIES } from '../lib/supabase'
import { Upload, X, Plus, Save } from 'lucide-react'

const CreateProduct: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    condition: 'new' as 'new' | 'used' | 'refurbished'
  })
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
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

      const uploadedUrls = await Promise.all(uploadPromises)
      setImages(prev => [...prev, ...uploadedUrls])
    } catch (error) {
      console.error('CreateProduct: Image upload error:', error)
      setError('Ошибка загрузки изображений')
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!user) {
      setError('Необходимо войти в систему')
      setLoading(false)
      return
    }

    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      setError('Заполните все обязательные поля')
      setLoading(false)
      return
    }

    if (images.length === 0) {
      setError('Добавьте хотя бы одно изображение')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase
        .from('products')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            condition: formData.condition,
            images: images,
            seller_id: user.id,
            is_sold: false,
            is_active: true
          }
        ])

      if (error) throw error

      navigate('/feed')
    } catch (error: any) {
      console.error('CreateProduct: Create error:', error)
      setError(error.message || 'Ошибка создания товара')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-text-secondary text-lg">Необходимо войти в систему</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Заголовок */}
      <div className="text-center">
        <h1 className="text-3xl font-display font-bold text-gradient mb-2">
          Продать железо
        </h1>
        <p className="text-text-secondary">
          Создай объявление и найди покупателя
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Основная информация */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Основная информация</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Название товара *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input w-full"
                placeholder="Например: RTX 3070 Gaming X Trio"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
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
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Состояние
              </label>
              <select
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className="input w-full"
              >
                <option value="new">Новое</option>
                <option value="used">Б/У</option>
                <option value="refurbished">Восстановленное</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Цена (₽) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input w-full"
                placeholder="50000"
                min="0"
                step="100"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Описание *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="input w-full h-32 resize-none"
                placeholder="Подробно опишите товар, его состояние, комплектацию..."
                required
              />
            </div>
          </div>
        </div>

        {/* Изображения */}
        <div className="card">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Изображения</h2>
          
          <div className="space-y-4">
            {/* Загрузка */}
            <div className="border-2 border-dashed border-primary-neon/30 rounded-lg p-8 text-center hover:border-primary-neon/50 transition-colors">
              <Upload className="w-12 h-12 text-primary-neon mx-auto mb-4" />
              <p className="text-text-secondary mb-4">
                Перетащите изображения сюда или нажмите для выбора
              </p>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="btn btn-secondary cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Выбрать файлы
              </label>
            </div>

            {/* Предпросмотр изображений */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Товар ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-danger-neon text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ошибка */}
        {error && (
          <div className="bg-danger-neon/10 border border-danger-neon/30 rounded-lg p-3">
            <p className="text-danger-neon text-sm">{error}</p>
          </div>
        )}

        {/* Кнопки */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/feed')}
            className="btn btn-secondary"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Создание...' : 'Создать объявление'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateProduct
