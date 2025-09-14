# Включение Realtime в Supabase для WebSocket чата

## 🔧 Пошаговая инструкция

### 1. **Включение Realtime в Supabase Dashboard**

1. **Перейдите в Supabase Dashboard**
   - Откройте [supabase.com](https://supabase.com)
   - Войдите в свой аккаунт
   - Выберите ваш проект

2. **Перейдите в настройки Realtime**
   - В левом меню нажмите **"Database"**
   - Выберите вкладку **"Replication"**
   - Или перейдите напрямую: `https://supabase.com/dashboard/project/[YOUR_PROJECT_ID]/database/replication`

3. **Включите репликацию для таблицы messages**
   - Найдите таблицу **`messages`** в списке
   - Переключите переключатель в положение **"ON"**
   - Нажмите **"Save"**

### 2. **Проверка настроек RLS**

Убедитесь, что Row Level Security (RLS) включен для таблицы `messages`:

1. **Перейдите в Database → Tables**
2. **Найдите таблицу `messages`**
3. **Проверьте, что RLS включен** (должна быть галочка)
4. **Если RLS не включен:**
   ```sql
   ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
   ```

### 3. **Проверка политик безопасности**

Убедитесь, что есть правильные RLS политики:

```sql
-- Политика: Пользователь может видеть свои сообщения
CREATE POLICY "Users can view their own messages" ON messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Политика: Пользователь может отправлять сообщения
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Политика: Пользователь может обновлять свои сообщения
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid() OR receiver_id = auth.uid());
```

### 4. **Тестирование Realtime подключения**

Откройте консоль браузера (F12) и проверьте:

1. **Подключение к WebSocket:**
   ```javascript
   // В консоли браузера
   console.log('Supabase client:', window.supabase)
   ```

2. **Проверка канала:**
   ```javascript
   // Создайте тестовый канал
   const channel = supabase.channel('test-channel')
   channel.subscribe((status) => {
     console.log('Channel status:', status)
   })
   ```

### 5. **Отладка проблем**

#### **Проблема: "Realtime не работает"**

**Проверьте:**
1. ✅ Realtime включен в Dashboard
2. ✅ Таблица `messages` добавлена в репликацию
3. ✅ RLS политики настроены правильно
4. ✅ Пользователь авторизован

#### **Проблема: "WebSocket не подключается"**

**Проверьте:**
1. ✅ Интернет соединение
2. ✅ Брандмауэр не блокирует WebSocket
3. ✅ Консоль браузера на ошибки

#### **Проблема: "Сообщения не приходят в реальном времени"**

**Проверьте:**
1. ✅ Фильтры в подписке правильные
2. ✅ `sender_id` и `receiver_id` корректные
3. ✅ Логи в Supabase Dashboard

### 6. **Мониторинг Realtime**

В Supabase Dashboard можно мониторить:

1. **Database → Replication** - статус репликации
2. **Logs → Realtime** - логи WebSocket подключений
3. **API → Realtime** - статистика использования

### 7. **Альтернативное решение (если Realtime не работает)**

Если Realtime все еще не работает, можно использовать периодическое обновление:

```typescript
// В Chat.tsx добавьте fallback
useEffect(() => {
  const interval = setInterval(async () => {
    // Обновляем сообщения каждые 2 секунды
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${sellerId}),and(sender_id.eq.${sellerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
    
    setMessages(data || [])
  }, 2000)

  return () => clearInterval(interval)
}, [user, sellerId])
```

## 🚀 После включения Realtime

1. **Перезагрузите страницу** в браузере
2. **Откройте консоль** (F12) для мониторинга
3. **Попробуйте отправить сообщение** в чате
4. **Проверьте, что сообщение приходит мгновенно**

## 📊 Ожидаемое поведение

После правильной настройки:

- ✅ **WebSocket подключается** автоматически
- ✅ **Сообщения доставляются** мгновенно
- ✅ **UI обновляется** в реальном времени
- ✅ **Нет задержек** при отправке/получении
- ✅ **Работает на всех устройствах** одновременно

## 🔍 Логи для отладки

В консоли браузера должны появиться логи:

```
Chat: Подписываемся на WebSocket канал
Chat: Получено новое сообщение через WebSocket: {...}
Chat: Отписываемся от WebSocket канала
```

Если этих логов нет, значит Realtime не работает и нужно проверить настройки.

**После включения Realtime в Supabase Dashboard чат должен работать мгновенно! 🎉**
