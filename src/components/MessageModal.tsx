import React, { useState } from 'react'
import { Modal, Input, Button, message } from 'antd'
import { SendOutlined, CloseOutlined } from '@ant-design/icons'
import { supabase } from '../lib/supabase'

const { TextArea } = Input

interface MessageModalProps {
  visible: boolean
  onClose: () => void
  sellerId: string
  sellerName: string
  productTitle: string
  buyerId: string
  buyerName: string
}

const MessageModal: React.FC<MessageModalProps> = ({
  visible,
  onClose,
  sellerId,
  sellerName,
  productTitle,
  buyerId,
  buyerName
}) => {
  const [messageText, setMessageText] = useState('')
  const [loading, setLoading] = useState(false)

  console.log('MessageModal: Компонент рендерится', { visible, sellerId, sellerName, productTitle, buyerId, buyerName })

  const handleSend = async () => {
    if (!messageText.trim()) {
      message.warning('Введите текст сообщения')
      return
    }

    setLoading(true)
    try {
      console.log('MessageModal: Отправляем сообщение продавцу:', sellerId)
      
      // Сохраняем сообщение в базе данных
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: buyerId,
            receiver_id: sellerId,
            product_id: null, // Можно добавить ID товара если нужно
            message_text: messageText.trim(),
            is_read: false,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) {
        console.error('MessageModal: Ошибка сохранения сообщения:', error)
        throw error
      }

      console.log('MessageModal: Сообщение сохранено:', data)

      // Отправляем push-уведомление
      await sendPushNotification(sellerId, buyerName, productTitle, messageText.trim())

      message.success('Сообщение отправлено! Продавец получит уведомление.')
      
      // Очищаем форму и закрываем модальное окно
      setMessageText('')
      onClose()

    } catch (error: any) {
      console.error('MessageModal: Ошибка отправки сообщения:', error)
      message.error(error.message || 'Ошибка отправки сообщения')
    } finally {
      setLoading(false)
    }
  }

  const sendPushNotification = async (receiverId: string, senderName: string, productTitle: string, messageText: string) => {
    try {
      console.log('MessageModal: Отправляем push-уведомление через Supabase:', receiverId)
      
      // Отправляем push-уведомление через Supabase
      const { error: pushError } = await supabase.functions.invoke('send-push-notification', {
        body: {
          user_id: receiverId,
          title: 'Новое сообщение',
          body: `${senderName} написал вам о товаре "${productTitle}": ${messageText.substring(0, 50)}${messageText.length > 50 ? '...' : ''}`,
          data: {
            type: 'message',
            sender_id: buyerId,
            sender_name: senderName,
            product_title: productTitle,
            message_text: messageText
          }
        }
      })

      if (pushError) {
        console.error('MessageModal: Ошибка отправки push-уведомления:', pushError)
        // Не выбрасываем ошибку, так как сообщение уже сохранено
      } else {
        console.log('MessageModal: Push-уведомление отправлено успешно')
      }

    } catch (error) {
      console.error('MessageModal: Ошибка при отправке push-уведомления:', error)
      // Не выбрасываем ошибку, так как сообщение уже сохранено
    }
  }

  const handleCancel = () => {
    setMessageText('')
    onClose()
  }

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Написать продавцу</span>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={handleCancel}
            style={{ color: '#9ca3af' }}
          />
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
      style={{
        top: '50%',
        transform: 'translateY(-50%)',
      }}
      styles={{
        body: {
          background: '#1a1a1a',
          padding: '24px',
        },
        header: {
          background: '#1a1a1a',
          borderBottom: '1px solid #374151',
        },
        content: {
          background: '#1a1a1a',
          border: '1px solid #374151',
        }
      }}
    >
      <div style={{ marginBottom: '16px' }}>
        <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
          Продавец: <span style={{ color: '#ffffff', fontWeight: 'bold' }}>{sellerName}</span>
        </div>
        <div style={{ color: '#9ca3af', fontSize: '14px' }}>
          Товар: <span style={{ color: '#ffffff' }}>{productTitle}</span>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <TextArea
          placeholder="Напишите сообщение продавцу..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          rows={4}
          maxLength={500}
          showCount
          style={{
            background: '#2a2a2a',
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#ffffff',
            resize: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button
          onClick={handleCancel}
          style={{
            color: '#9ca3af',
            borderColor: '#374151',
          }}
        >
          Отмена
        </Button>
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          loading={loading}
          style={{
            background: '#00ff88',
            borderColor: '#00ff88',
            color: '#000',
          }}
        >
          Отправить
        </Button>
      </div>
    </Modal>
  )
}

export default MessageModal
