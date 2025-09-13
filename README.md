# HardWire - Биржа железа

Современная платформа для торговли комплектующими ПК в стиле киберпанк.

## 🚀 Возможности

- **Регистрация и авторизация** через Supabase Auth
- **Создание объявлений** с фотографиями и подробным описанием
- **Категории товаров** - процессоры, видеокарты, материнские платы и др.
- **Поиск и фильтрация** по названию, категориям, цене
- **Сортировка** по дате и цене
- **Профиль пользователя** с возможностью редактирования
- **Современный дизайн** в стиле киберпанк

## 🛠 Технологии

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Стили**: CSS с киберпанк темой
- **Иконки**: Lucide React
- **Анимации**: Framer Motion

## 📦 Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd hardWire
```

2. Установите зависимости:
```bash
npm install
```

3. Настройте Supabase:
   - Создайте проект на [supabase.com](https://supabase.com)
   - Скопируйте `.env.example` в `.env.local`
   - Заполните переменные окружения:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Создайте таблицы в Supabase:

```sql
-- Таблица пользователей
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица товаров
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'used', 'refurbished')),
  images TEXT[] DEFAULT '{}',
  seller_id UUID REFERENCES users(id) NOT NULL,
  is_sold BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица избранного (лайки)
CREATE TABLE favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Таблица комментариев
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица подписок
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category)
);

-- RLS политики
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Политики для users
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Политики для products
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Users can create products" ON products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Users can update own products" ON products FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Users can delete own products" ON products FOR DELETE USING (auth.uid() = seller_id);

-- Политики для comments
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Users can create comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Политики для subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own subscriptions" ON subscriptions FOR DELETE USING (auth.uid() = user_id);
```

5. Создайте bucket для изображений:
   - В Supabase Dashboard перейдите в Storage
   - Создайте bucket с именем `product-images`
   - Установите политику доступа (Public)

6. Запустите проект:
```bash
npm run dev
```

## 🎨 Дизайн

Проект использует киберпанк стиль с:
- Неоновыми цветами (зеленый, розовый, голубой)
- Градиентами и свечением
- Футуристическими шрифтами (Orbitron, Rajdhani)
- Анимациями и эффектами
- Темной цветовой схемой

## 📱 Страницы

- **/** - Главная страница с информацией о платформе
- **/login** - Вход в систему
- **/register** - Регистрация
- **/feed** - Лента всех товаров с поиском и фильтрами
- **/create** - Создание нового объявления
- **/profile** - Профиль пользователя с управлением товарами
- **/product/:id** - Детальная страница товара
- **/edit/:id** - Редактирование товара
- **/categories** - Подписки на категории

## 🔧 Разработка

```bash
# Запуск в режиме разработки
npm run dev

# Сборка для продакшена
npm run build

# Предварительный просмотр сборки
npm run preview

# Проверка типов
npm run type-check
```

## 📄 Лицензия

MIT License

## 🔄 Миграция базы данных

Если у вас уже есть существующая база данных без поля `is_active`, выполните следующую миграцию:

```sql
-- Добавляем поле is_active в таблицу products
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Обновляем существующие записи
UPDATE products SET is_active = true WHERE is_active IS NULL;

-- Создаем индекс для быстрого поиска активных товаров
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- Создаем индекс для поиска по продавцу и статусу
CREATE INDEX IF NOT EXISTS idx_products_seller_active ON products(seller_id, is_active);
```

## ✨ Новые возможности

- **Управление товарами** - скрытие/показ и удаление товаров в профиле
- **Редактирование товаров** - полное редактирование всех полей товара
- **Статистика пользователя** - количество товаров, активных, проданных
- **Загрузка аватаров** - возможность загружать фото профиля
- **Детальная страница товара** - полная информация о товаре
- **Ссылки на профили продавцов** - переход к профилю продавца
- **Чекбоксы для фильтров** - современный интерфейс выбора категорий