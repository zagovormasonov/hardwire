# Проверка работы Realtime в Supabase

## 🔍 Диагностика проблемы

### 1. **Проверьте логи в консоли браузера**

Откройте консоль (F12) и найдите эти логи:

#### ✅ **Если WebSocket работает:**
```
Chat: Подписываемся на WebSocket канал
Chat: WebSocket статус: SUBSCRIBED
Chat: WebSocket успешно подключен
Chat: Получено новое сообщение через WebSocket: {...}
```

#### ❌ **Если WebSocket НЕ работает:**
```
Chat: Подписываемся на WebSocket канал
Chat: WebSocket статус: CHANNEL_ERROR
Chat: Ошибка WebSocket подключения
Chat: Запускаем fallback обновление сообщений
Chat: Fallback обнаружил новые сообщения
```

### 2. **Проверьте настройки Realtime в Supabase**

1. **Перейдите в Supabase Dashboard**
2. **Database → Replication**
3. **Убедитесь, что таблица `messages` включена**

Если таблица не включена:
- Найдите таблицу `messages`
- Переключите переключатель в положение **ON**
- Нажмите **Save**

### 3. **Проверьте RLS политики**

Выполните в SQL Editor:

```sql
-- Проверьте, что RLS включен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'messages';

-- Проверьте политики
SELECT * FROM pg_policies 
WHERE tablename = 'messages';
```

### 4. **Тест Realtime подключения**

Выполните в консоли браузера:

```javascript
// Тест подключения к Realtime
const testChannel = supabase.channel('test')
testChannel.subscribe((status) => {
  console.log('Test channel status:', status)
})

// Тест отправки сообщения
setTimeout(() => {
  supabase.from('messages').insert({
    sender_id: 'your-user-id',
    receiver_id: 'other-user-id', 
    message_text: 'Test message'
  })
}, 2000)
```

## 🚀 Решения

### **Решение 1: Включить Realtime**

1. **Supabase Dashboard → Database → Replication**
2. **Включите репликацию для таблицы `messages`**
3. **Перезагрузите страницу**

### **Решение 2: Проверить RLS**

```sql
-- Включить RLS если не включен
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Создать политики если их нет
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());
```

### **Решение 3: Fallback система**

Если Realtime не работает, fallback система будет обновлять сообщения каждые 1.5 секунды.

**Логи fallback:**
```
Chat: Запускаем fallback обновление сообщений
Chat: Fallback обнаружил новые сообщения
Chat: Принудительное обновление выполнено
```

## 📊 Ожидаемое поведение

### **С Realtime:**
- ✅ Сообщения приходят мгновенно
- ✅ WebSocket статус: SUBSCRIBED
- ✅ Логи: "Получено новое сообщение через WebSocket"

### **Без Realtime (fallback):**
- ✅ Сообщения приходят через 1.5 секунды
- ✅ WebSocket статус: CHANNEL_ERROR
- ✅ Логи: "Fallback обнаружил новые сообщения"

## 🔧 Дополнительная отладка

### **Проверьте сетевые запросы:**

1. **Откройте DevTools → Network**
2. **Отправьте сообщение**
3. **Проверьте запросы:**
   - `POST /rest/v1/messages` - отправка сообщения
   - `WebSocket` соединения - Realtime подключения

### **Проверьте Supabase логи:**

1. **Supabase Dashboard → Logs**
2. **Выберите "Realtime"**
3. **Проверьте ошибки подключения**

## 🎯 Быстрый тест

1. **Откройте два окна браузера**
2. **Авторизуйтесь под разными пользователями**
3. **Откройте чат между ними**
4. **Отправьте сообщение в одном окне**
5. **Проверьте, появилось ли сообщение в другом окне**

**Если сообщение не появилось в течение 2 секунд - Realtime не работает, используется fallback.**
