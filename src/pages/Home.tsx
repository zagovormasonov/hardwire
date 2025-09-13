import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Cpu, HardDrive, Monitor, Zap, ArrowRight, Star } from 'lucide-react'
import SupabaseTest from '../components/SupabaseTest'

const Home: React.FC = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: <Cpu className="w-8 h-8" />,
      title: 'Процессоры',
      description: 'Найди идеальный CPU для своей сборки'
    },
    {
      icon: <HardDrive className="w-8 h-8" />,
      title: 'Видеокарты',
      description: 'RTX, GTX, RX - все карты в одном месте'
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      title: 'Комплектующие',
      description: 'Материнские платы, память, накопители'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Быстрая продажа',
      description: 'Продай свое железо за считанные минуты'
    }
  ]

  return (
    <div className="space-y-16">
      {/* Тест подключения */}
      <SupabaseTest />
      
      {/* Hero секция */}
      <section className="text-center py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-display font-bold text-gradient mb-6">
            HardWire
          </h1>
          <p className="text-xl md:text-2xl text-text-secondary mb-8 leading-relaxed">
            Биржа железа нового поколения.<br />
            Покупай, продавай, обменивайся комплектующими ПК.
          </p>
          
          {user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/feed" className="btn btn-primary text-lg px-8 py-4">
                Перейти к ленте
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/create" className="btn btn-secondary text-lg px-8 py-4">
                Продать железо
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-4">
                Начать торговлю
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link to="/feed" className="btn btn-secondary text-lg px-8 py-4">
                Посмотреть ленту
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Статистика */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-8">
        <div className="text-center">
          <div className="text-3xl font-display font-bold text-primary-neon mb-2">1000+</div>
          <div className="text-text-secondary">Активных пользователей</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-display font-bold text-accent-neon mb-2">5000+</div>
          <div className="text-text-secondary">Товаров на продажу</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-display font-bold text-secondary-neon mb-2">100+</div>
          <div className="text-text-secondary">Категорий железа</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-display font-bold text-warning-neon mb-2">24/7</div>
          <div className="text-text-secondary">Поддержка</div>
        </div>
      </section>

      {/* Особенности */}
      <section>
        <h2 className="text-3xl font-display font-bold text-center text-gradient mb-12">
          Почему HardWire?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="card text-center hover:scale-105 transition-transform duration-300">
              <div className="text-primary-neon mb-4 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-text-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-text-secondary">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA секция */}
      <section className="text-center py-16 bg-gradient-to-r from-primary-neon/10 to-accent-neon/10 rounded-2xl border border-primary-neon/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-display font-bold text-gradient mb-6">
            Готов начать торговлю?
          </h2>
          <p className="text-xl text-text-secondary mb-8">
            Присоединяйся к крупнейшему сообществу энтузиастов железа
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn btn-primary text-lg px-8 py-4">
                Создать аккаунт
                <Star className="ml-2 w-5 h-5" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default Home
