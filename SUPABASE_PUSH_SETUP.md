# Настройка Supabase Push-уведомлений

## 1. Выполнение миграций базы данных

Выполните SQL скрипт `supabase_messages_tables.sql` в Supabase Dashboard:

1. Перейдите в Supabase Dashboard
2. Выберите ваш проект
3. Перейдите в "SQL Editor"
4. Скопируйте содержимое файла `supabase_messages_tables.sql`
5. Выполните запрос

Это создаст следующие таблицы:
- `messages` - для хранения сообщений между пользователями
- `push_subscriptions` - для хранения подписок на push-уведомления
- `notifications` - для хранения уведомлений

## 2. Настройка VAPID ключей

Для web push уведомлений нужны VAPID ключи:

1. Установите Node.js пакет для генерации ключей:
```bash
npm install web-push
```

2. Создайте файл `generate-vapid.js`:
```javascript
const webpush = require('web-push');

const vapidKeys = webpush.generateVAPIDKeys();

console.log('VAPID Public Key:', vapidKeys.publicKey);
console.log('VAPID Private Key:', vapidKeys.privateKey);
```

3. Запустите скрипт:
```bash
node generate-vapid.js
```

4. Сохраните полученные ключи

## 3. Настройка Edge Function

1. В Supabase Dashboard перейдите в "Edge Functions"
2. Создайте новую функцию с именем `send-push-notification`
3. Скопируйте код из файла `supabase/functions/send-push-notification/index.ts`
4. В настройках функции добавьте переменные окружения:
   - `VAPID_PUBLIC_KEY` = ваш публичный VAPID ключ
   - `VAPID_PRIVATE_KEY` = ваш приватный VAPID ключ
   - `VAPID_EMAIL` = ваш email (например, mailto:admin@example.com)

## 4. Деплой Edge Function

```bash
# Установите Supabase CLI
npm install -g supabase

# Войдите в Supabase
supabase login

# Свяжите проект
supabase link --project-ref your-project-ref

# Деплой функции
supabase functions deploy send-push-notification
```

## 5. Создание компонента для подписки на уведомления

Создайте файл `src/hooks/usePushNotifications.ts`:

```typescript
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const usePushNotifications = () => {
  const { user } = useAuth()
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true)
      setPermission(Notification.permission)
    }
  }, [])

  const subscribeToPush = async () => {
    if (!user || !isSupported) return false

    try {
      // Запрашиваем разрешение
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false

      // Регистрируем service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      
      // Получаем подписку на push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // Замените на ваш ключ
      })

      // Сохраняем подписку в базе данных
      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subscription.endpoint,
          p256dh_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))),
          auth_key: btoa(String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))),
          is_active: true
        })

      if (error) {
        console.error('Ошибка сохранения подписки:', error)
        return false
      }

      console.log('Подписка на push-уведомления создана')
      return true

    } catch (error) {
      console.error('Ошибка подписки на push-уведомления:', error)
      return false
    }
  }

  return { isSupported, permission, subscribeToPush }
}
```

## 6. Создание Service Worker

Создайте файл `public/sw.js`:

```javascript
// Service Worker для обработки push-уведомлений
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)

  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Новое сообщение'
  const body = data.body || 'У вас новое сообщение'
  const icon = data.icon || '/icon-192x192.png'
  const badge = data.badge || '/badge-72x72.png'

  const options = {
    body: body,
    icon: icon,
    badge: badge,
    tag: 'hardwire-message',
    data: data.data || {}
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()
  
  // Открываем приложение
  event.waitUntil(
    clients.openWindow('/messages')
  )
})
```

## 7. Интеграция в приложение

Добавьте в ваш Layout или App компонент:

```typescript
import { usePushNotifications } from '../hooks/usePushNotifications'

const Layout = () => {
  const { isSupported, subscribeToPush } = usePushNotifications()

  useEffect(() => {
    if (isSupported) {
      subscribeToPush()
    }
  }, [isSupported])

  return (
    // ваш JSX
  )
}
```

## 8. Тестирование

1. Запустите приложение
2. Авторизуйтесь
3. Разрешите уведомления в браузере
4. Перейдите на страницу товара
5. Нажмите "Написать продавцу"
6. Отправьте сообщение
7. Проверьте, что уведомление появилось

## Возможные проблемы и решения

### Проблема: "Service Worker не регистрируется"
**Решение:** 
1. Убедитесь, что файл `sw.js` находится в папке `public`
2. Проверьте, что приложение работает по HTTPS
3. Проверьте консоль браузера на ошибки

### Проблема: "VAPID ключи не работают"
**Решение:**
1. Убедитесь, что ключи правильно сгенерированы
2. Проверьте, что публичный ключ правильно передается в `applicationServerKey`
3. Убедитесь, что приватный ключ правильно настроен в Edge Function

### Проблема: "Уведомления не приходят"
**Решение:**
1. Проверьте, что подписка сохранена в базе данных
2. Проверьте логи Edge Function в Supabase Dashboard
3. Убедитесь, что Service Worker правильно обрабатывает push события

## Преимущества Supabase Push-уведомлений

✅ **Простота настройки** - не нужен Firebase
✅ **Интеграция с базой данных** - уведомления сохраняются в Supabase
✅ **Безопасность** - RLS политики защищают данные
✅ **Масштабируемость** - Supabase обрабатывает нагрузку
✅ **Отладка** - логи в Supabase Dashboard
✅ **Бесплатный тариф** - входит в бесплатный план Supabase

## Дополнительные возможности

### Уведомления в приложении
Можно создать компонент для показа уведомлений внутри приложения:

```typescript
const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([])
  
  useEffect(() => {
    // Подписываемся на изменения в таблице notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()

    return () => subscription.unsubscribe()
  }, [])

  return (
    <div>
      {notifications.map(notification => (
        <div key={notification.id}>
          <h4>{notification.title}</h4>
          <p>{notification.body}</p>
        </div>
      ))}
    </div>
  )
}
```

### Отправка уведомлений из других частей приложения
```typescript
const sendNotification = async (userId: string, title: string, body: string) => {
  await supabase.functions.invoke('send-push-notification', {
    body: { user_id: userId, title, body }
  })
}
```
