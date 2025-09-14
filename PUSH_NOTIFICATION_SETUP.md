# Настройка Edge Function для Push-уведомлений

## Проблема
Получаете CORS ошибку при вызове `send-push-notification` Edge Function:
```
Access to fetch at 'https://gopfkqwtcvwnkbghvbov.supabase.co/functions/v1/send-push-notification' from origin 'https://hardwire.vercel.app' has been blocked by CORS policy
```

## Решение

### 1. Развертывание Edge Function

Выполните команды в терминале Supabase CLI:

```bash
# Убедитесь, что вы в корневой папке проекта
cd C:\Users\user\Desktop\hardWire

# Разверните Edge Function
supabase functions deploy send-push-notification

# Проверьте статус
supabase functions list
```

### 2. Настройка переменных окружения

В Supabase Dashboard → Settings → Edge Functions добавьте:

```env
VAPID_PUBLIC_KEY=your_vapid_public_key
VAPID_PRIVATE_KEY=your_vapid_private_key  
VAPID_EMAIL=your_email@example.com
SUPABASE_URL=https://gopfkqwtcvwnkbghvbov.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Генерация VAPID ключей (если нужно)

```bash
# Установите web-push (если не установлен)
npm install -g web-push

# Сгенерируйте ключи
web-push generate-vapid-keys
```

### 4. Проверка работы

После настройки функция должна отвечать на:
```
https://gopfkqwtcvwnkbghvbov.supabase.co/functions/v1/send-push-notification
```

### 5. Временное решение

Пока Edge Function не настроена, чат работает без push-уведомлений:
- Сообщения отправляются и сохраняются в базе данных
- Получатель видит сообщения через периодическое обновление
- Toast уведомления работают локально

## Логи для проверки

**Успешная отправка сообщения:**
```
ChatSimple: Сообщение отправлено успешно
ChatSimple: Push-уведомление отправлено
```

**Если Edge Function не настроена:**
```
ChatSimple: Сообщение отправлено успешно
ChatSimple: Push-уведомление пропущено (CORS или функция не настроена): [ошибка]
```

## Важно

- **Чат работает** даже без push-уведомлений
- **Сообщения сохраняются** в базе данных
- **Получатель видит сообщения** через обновление каждую секунду
- **Toast уведомления** работают локально

Настройка Edge Function нужна только для push-уведомлений на другие устройства/браузеры.
