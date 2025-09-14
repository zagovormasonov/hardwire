import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Divider, message } from 'antd'
import { MailOutlined, LockOutlined, UserOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Title, Text } = Typography

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values: { email: string; password: string; fullName: string }) => {
    setLoading(true)
    try {
      await signUp(values.email, values.password, values.fullName)
      message.success('Регистрация успешна! Добро пожаловать!')
      navigate('/')
    } catch (error: any) {
      message.error(error.message || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: '400px',
          background: '#1a1a1a',
          border: '1px solid #374151',
          borderRadius: '16px',
        }}
        bodyStyle={{ padding: '48px 32px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
            Регистрация в HardWire
          </Title>
          <Text style={{ color: '#9ca3af' }}>
            Создайте свой аккаунт
          </Text>
        </div>

        <Form
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="fullName"
            rules={[
              { required: true, message: 'Введите ваше имя' },
              { min: 2, message: 'Имя должно содержать минимум 2 символа' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Полное имя"
              style={{
                background: '#2a2a2a',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Введите email' },
              { type: 'email', message: 'Неверный формат email' }
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Email"
              style={{
                background: '#2a2a2a',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Введите пароль' },
              { min: 6, message: 'Пароль должен содержать минимум 6 символов' }
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Пароль"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              style={{
                background: '#2a2a2a',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Подтвердите пароль' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Пароли не совпадают'))
                },
              }),
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
              placeholder="Подтвердите пароль"
              iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              style={{
                background: '#2a2a2a',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: '48px',
                background: '#00ff88',
                borderColor: '#00ff88',
                color: '#000',
                fontSize: '16px',
                fontWeight: 'bold',
              }}
            >
              Зарегистрироваться
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: '#374151' }}>
          <Text style={{ color: '#9ca3af' }}>или</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: '#9ca3af' }}>
            Уже есть аккаунт?{' '}
            <Link 
              to="/login" 
              style={{ 
                color: '#00ff88',
                fontWeight: 'bold',
              }}
            >
              Войти
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default Register