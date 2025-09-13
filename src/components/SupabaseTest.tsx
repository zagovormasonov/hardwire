import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const SupabaseTest: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<string>('Проверка...')
  const [userCount, setUserCount] = useState<number | null>(null)

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Тестируем подключение к Supabase
        const { data, error } = await supabase
          .from('users')
          .select('count', { count: 'exact' })

        if (error) {
          setConnectionStatus(`Ошибка подключения: ${error.message}`)
          console.error('Supabase connection error:', error)
        } else {
          setConnectionStatus('Подключение успешно')
          setUserCount(data?.[0]?.count || 0)
        }
      } catch (err) {
        setConnectionStatus(`Ошибка: ${err}`)
        console.error('Connection test error:', err)
      }
    }

    testConnection()
  }, [])

  return (
    <div className="card">
      <h3 className="text-white text-lg font-semibold mb-4">Тест подключения к Supabase</h3>
      <p className="text-gray-300 mb-2">Статус: <span className="text-neon-green">{connectionStatus}</span></p>
      {userCount !== null && (
        <p className="text-gray-300">Пользователей в БД: <span className="text-neon-blue">{userCount}</span></p>
      )}
    </div>
  )
}

export default SupabaseTest
