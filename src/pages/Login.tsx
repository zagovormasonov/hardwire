import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, Typography, Divider, message } from 'antd'
import { MailOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { useAuth } from '../contexts/AuthContext'

const { Title, Text } = Typography

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true)
    try {
      await signIn(values.email, values.password)
      message.success('Добро пожаловать!')
      navigate('/')
    } catch (error: any) {
      message.error(error.message || 'Ошибка входа')
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
            Вход в HardWire
          </Title>
          <Text style={{ color: '#9ca3af' }}>
            Войдите в свой аккаунт
          </Text>
        </div>

        <Form
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
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
              Войти
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ borderColor: '#374151' }}>
          <Text style={{ color: '#9ca3af' }}>или</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: '#9ca3af' }}>
            Нет аккаунта?{' '}
            <Link 
              to="/register" 
              style={{ 
                color: '#00ff88',
                fontWeight: 'bold',
              }}
            >
              Зарегистрироваться
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  )
}

export default Login