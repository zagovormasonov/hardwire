# Настройка Firebase для Push-уведомлений

## 1. Создание проекта в Firebase Console

1. Перейдите на [Firebase Console](https://console.firebase.google.com/)
2. Нажмите "Создать проект" или "Add project"
3. Введите название проекта (например, "hardwire-app")
4. Выберите регион (рекомендуется ближайший к вашим пользователям)
5. Настройте Google Analytics (опционально)

## 2. Добавление веб-приложения

1. В Firebase Console выберите ваш проект
2. Нажмите на иконку веб-приложения (`</>`)
3. Введите название приложения (например, "HardWire Web")
4. Отметьте "Also set up Firebase Hosting" (опционально)
5. Нажмите "Register app"
6. Скопируйте конфигурацию Firebase (она понадобится позже)

## 3. Настройка Cloud Messaging

1. В левом меню выберите "Messaging"
2. Нажмите "Get started"
3. Нажмите "Create your first campaign"
4. Выберите "Web push"
5. Введите название кампании (например, "HardWire Messages")

## 4. Получение серверного ключа

1. В Firebase Console перейдите в "Project Settings" (шестеренка)
2. Выберите вкладку "Cloud Messaging"
3. В разделе "Web configuration" найдите "Server key"
4. Скопируйте серверный ключ (он понадобится для Edge Function)

## 5. Настройка Supabase Edge Function

1. В Supabase Dashboard перейдите в "Edge Functions"
2. Создайте новую функцию с именем `send-push-notification`
3. Скопируйте код из файла `supabase/functions/send-push-notification/index.ts`
4. В настройках функции добавьте переменную окружения:
   - `FCM_SERVER_KEY` = ваш серверный ключ из Firebase

## 6. Настройка манифеста веб-приложения

Создайте файл `public/manifest.json`:

```json
{
  "name": "HardWire",
  "short_name": "HardWire",
  "description": "Платформа для продажи железа",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#00ff88",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## 7. Добавление Firebase SDK в приложение

Установите Firebase SDK:

```bash
npm install firebase
```

Создайте файл `src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
}

const app = initializeApp(firebaseConfig)
export const messaging = getMessaging(app)

// Функция для получения токена устройства
export const getDeviceToken = async () => {
  try {
    const token = await getToken(messaging, {
      vapidKey: 'your-vapid-key' // Получите в Firebase Console > Project Settings > Cloud Messaging
    })
    return token
  } catch (error) {
    console.error('Ошибка получения токена:', error)
    return null
  }
}

// Функция для прослушивания сообщений
export const onMessageListener = () => {
  return new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload)
    })
  })
}
```

## 8. Регистрация токенов устройств

Добавьте в ваш AuthContext или отдельный хук:

```typescript
import { getDeviceToken } from '../lib/firebase'
import { supabase } from '../lib/supabase'

export const usePushNotifications = () => {
  const registerDevice = async (userId: string) => {
    try {
      const token = await getDeviceToken()
      if (token) {
        await supabase.from('user_devices').upsert({
          user_id: userId,
          device_token: token,
          device_type: 'web',
          is_active: true
        })
        console.log('Токен устройства зарегистрирован:', token)
      }
    } catch (error) {
      console.error('Ошибка регистрации токена:', error)
    }
  }

  return { registerDevice }
}
```

## 9. Запрос разрешений на уведомления

Добавьте в ваш Layout или App компонент:

```typescript
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { usePushNotifications } from '../hooks/usePushNotifications'

const App = () => {
  const { user } = useAuth()
  const { registerDevice } = usePushNotifications()

  useEffect(() => {
    if (user && 'Notification' in window) {
      // Запрашиваем разрешение на уведомления
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          registerDevice(user.id)
        }
      })
    }
  }, [user, registerDevice])

  return (
    // ваш JSX
  )
}
```

## 10. Выполнение миграций базы данных

Выполните SQL скрипт `supabase_messages_tables.sql` в Supabase Dashboard:

1. Перейдите в Supabase Dashboard
2. Выберите ваш проект
3. Перейдите в "SQL Editor"
4. Скопируйте содержимое файла `supabase_messages_tables.sql`
5. Выполните запрос

## 11. Тестирование

1. Запустите приложение
2. Авторизуйтесь
3. Перейдите на страницу товара
4. Нажмите "Написать продавцу"
5. Отправьте сообщение
6. Проверьте консоль браузера на наличие ошибок

## Возможные проблемы и решения

### Проблема: "Service Worker не найден"
**Решение:** Добавьте файл `public/firebase-messaging-sw.js`:

```javascript
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
})

const messaging = firebase.messaging()
```

### Проблема: "CORS ошибки"
**Решение:** Убедитесь, что в Supabase Edge Function правильно настроены CORS заголовки.

### Проблема: "Токен не генерируется"
**Решение:** 
1. Проверьте, что VAPID ключ правильно настроен
2. Убедитесь, что приложение работает по HTTPS
3. Проверьте, что Service Worker зарегистрирован

## Дополнительные настройки

### Для продакшена:
1. Настройте домен в Firebase Console
2. Добавьте ваш домен в "Authorized domains"
3. Настройте SSL сертификаты
4. Обновите переменные окружения в Supabase

### Для мобильных приложений:
1. Добавьте Android и iOS приложения в Firebase
2. Скачайте конфигурационные файлы
3. Настройте push-уведомления для каждой платформы
4. Обновите Edge Function для поддержки мобильных токенов
