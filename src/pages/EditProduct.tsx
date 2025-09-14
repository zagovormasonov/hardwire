import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Card, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Button, 
  Upload, 
  Typography, 
  Space, 
  Row, 
  Col,
  message,
  Spin,
  Image
} from 'antd'
import { 
  ArrowLeftOutlined, 
  UploadOutlined, 
  DeleteOutlined, 
  SaveOutlined 
} from '@ant-design/icons'
import { supabase, CATEGORIES } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

const { Title, Text } = Typography
const { TextArea } = Input
const { Option } = Select

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
  const [form] = Form.useForm()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  useEffect(() => {
    if (id) {
      fetchProduct()
    }
  }, [id])

  const fetchProduct = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (!data) {
        message.error('Товар не найден')
        navigate('/profile')
        return
      }

      if (data.seller_id !== user?.id) {
        message.error('У вас нет прав для редактирования этого товара')
        navigate('/profile')
        return
      }

      setProduct(data)
      setImages(data.images || [])
      
      // Заполняем форму данными товара
      form.setFieldsValue({
        title: data.title,
        description: data.description,
        price: data.price,
        category: data.category,
        condition: data.condition
      })
    } catch (error) {
      message.error('Ошибка загрузки товара')
      navigate('/profile')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: any) => {
    if (!user) return false

    if (file.size > 5 * 1024 * 1024) {
      message.error('Размер файла не должен превышать 5MB')
      return false
    }

    if (!file.type.startsWith('image/')) {
      message.error('Выберите изображение (JPG, PNG, GIF)')
      return false
    }

    if (images.length >= 5) {
      message.error('Максимум 5 изображений')
      return false
    }

    setUploadingImages(true)
    try {
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

      setImages(prev => [...prev, data.publicUrl])
      message.success('Изображение загружено')
      return false // Предотвращаем автоматическую загрузку
    } catch (error: any) {
      message.error('Ошибка загрузки изображения')
      return false
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const onFinish = async (values: any) => {
    if (!user || !product) {
      message.error('Необходимо войти в систему')
      return
    }

    if (images.length === 0) {
      message.error('Добавьте хотя бы одно изображение')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('products')
        .update({
          title: values.title,
          description: values.description,
          price: values.price,
          category: values.category,
          condition: values.condition,
          images: images,
          updated_at: new Date().toISOString()
        })
        .eq('id', product.id)

      if (error) throw error

      message.success('Товар успешно обновлен!')
      navigate('/profile')
    } catch (error: any) {
      message.error('Ошибка обновления товара')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!product) {
    return (
      <div style={{ padding: '24px 0' }}>
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Title level={2} style={{ color: '#ffffff' }}>
            Товар не найден
          </Title>
          <Text style={{ color: '#9ca3af' }}>
            Возможно, товар был удален или у вас нет прав для его редактирования
          </Text>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ marginBottom: '32px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/profile')}
          style={{ marginBottom: '16px' }}
        >
          Назад к профилю
        </Button>
        
        <Title level={2} style={{ color: '#ffffff', margin: 0 }}>
          Редактировать товар
        </Title>
        <Text style={{ color: '#9ca3af' }}>
          Измените информацию о вашем товаре
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '16px',
            }}
            bodyStyle={{ padding: '32px' }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              size="large"
            >
              <Form.Item
                name="title"
                label={<Text style={{ color: '#ffffff' }}>Название товара</Text>}
                rules={[
                  { required: true, message: 'Введите название товара' },
                  { min: 3, message: 'Название должно содержать минимум 3 символа' }
                ]}
              >
                <Input
                  placeholder="Например: RTX 3070 Gaming X Trio"
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
              </Form.Item>

              <Form.Item
                name="description"
                label={<Text style={{ color: '#ffffff' }}>Описание</Text>}
                rules={[
                  { required: true, message: 'Введите описание товара' },
                  { min: 10, message: 'Описание должно содержать минимум 10 символов' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Подробно опишите состояние товара, его характеристики и особенности..."
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="price"
                    label={<Text style={{ color: '#ffffff' }}>Цена (₽)</Text>}
                    rules={[
                      { required: true, message: 'Введите цену' },
                      { type: 'number', min: 1, message: 'Цена должна быть больше 0' }
                    ]}
                  >
                    <InputNumber
                      placeholder="50000"
                      style={{
                        width: '100%',
                        background: '#2a2a2a',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                      parser={(value) => value!.replace(/\s?/g, '')}
                    />
                  </Form.Item>
                </Col>
                
                <Col xs={24} sm={12}>
                  <Form.Item
                    name="condition"
                    label={<Text style={{ color: '#ffffff' }}>Состояние</Text>}
                    rules={[{ required: true, message: 'Выберите состояние товара' }]}
                  >
                    <Select
                      style={{
                        background: '#2a2a2a',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                      }}
                    >
                      <Option value="new">Новый</Option>
                      <Option value="used">Б/У</Option>
                      <Option value="refurbished">Восстановленный</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="category"
                label={<Text style={{ color: '#ffffff' }}>Категория</Text>}
                rules={[{ required: true, message: 'Выберите категорию' }]}
              >
                <Select
                  placeholder="Выберите категорию"
                  style={{
                    background: '#2a2a2a',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                  }}
                >
                  {CATEGORIES.map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={saving}
                    style={{
                      background: '#00ff88',
                      borderColor: '#00ff88',
                      color: '#000',
                      height: '48px',
                      padding: '0 32px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                    }}
                  >
                    Сохранить изменения
                  </Button>
                  
                  <Button
                    onClick={() => navigate('/profile')}
                    style={{ height: '48px', padding: '0 32px' }}
                  >
                    Отмена
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            style={{
              background: '#1a1a1a',
              border: '1px solid #374151',
              borderRadius: '16px',
            }}
            bodyStyle={{ padding: '24px' }}
          >
            <Title level={4} style={{ color: '#ffffff', marginBottom: '16px' }}>
              Изображения товара
            </Title>
            
            <Text style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '16px', display: 'block' }}>
              Управляйте фотографиями вашего товара (максимум 5 изображений)
            </Text>

            <Upload
              beforeUpload={handleImageUpload}
              showUploadList={false}
              accept="image/*"
              multiple
              disabled={images.length >= 5 || uploadingImages}
            >
              <Button
                icon={<UploadOutlined />}
                loading={uploadingImages}
                disabled={images.length >= 5}
                style={{
                  width: '100%',
                  height: '48px',
                  background: '#2a2a2a',
                  border: '1px solid #374151',
                  color: '#ffffff',
                }}
              >
                {uploadingImages ? 'Загрузка...' : 'Добавить изображения'}
              </Button>
            </Upload>

            {images.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <Text style={{ color: '#9ca3af', fontSize: '12px' }}>
                  Загружено: {images.length}/5
                </Text>
                
                <div style={{ marginTop: '12px' }}>
                  {images.map((image, index) => (
                    <div
                      key={index}
                      style={{
                        position: 'relative',
                        marginBottom: '8px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                      }}
                    >
                      <Image
                        src={image}
                        alt={`Upload ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'cover',
                        }}
                      />
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        size="small"
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: 'rgba(0, 0, 0, 0.7)',
                          color: '#ffffff',
                        }}
                        onClick={() => removeImage(index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default EditProduct