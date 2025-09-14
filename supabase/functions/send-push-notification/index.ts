import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, title, body, data } = await req.json()

    if (!user_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: user_id, title, body' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Создаем клиент Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Supabase Push: Отправляем уведомление пользователю:', user_id)

    // Отправляем push-уведомление через Supabase
    const { data: notificationData, error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id: user_id,
        title: title,
        body: body,
        data: data || {},
        type: 'message',
        is_read: false
      })
      .select()

    if (notificationError) {
      console.error('Supabase Push: Ошибка создания уведомления:', notificationError)
      return new Response(
        JSON.stringify({ error: 'Failed to create notification', details: notificationError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Supabase Push: Уведомление создано:', notificationData)

    // Если у пользователя есть подписка на push-уведомления, отправляем их
    const { data: subscriptions, error: subscriptionError } = await supabaseClient
      .from('push_subscriptions')
      .select('endpoint, p256dh_key, auth_key')
      .eq('user_id', user_id)
      .eq('is_active', true)

    if (subscriptionError) {
      console.error('Supabase Push: Ошибка получения подписок:', subscriptionError)
    } else if (subscriptions && subscriptions.length > 0) {
      console.log('Supabase Push: Найдено подписок:', subscriptions.length)
      
      // Отправляем push-уведомления на все устройства пользователя
      for (const subscription of subscriptions) {
        try {
          await sendWebPushNotification(subscription, title, body, data)
        } catch (error) {
          console.error('Supabase Push: Ошибка отправки на устройство:', error)
        }
      }
    } else {
      console.log('Supabase Push: У пользователя нет активных подписок на push-уведомления')
    }

    return new Response(
      JSON.stringify({ success: true, notification: notificationData[0] }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Supabase Push: Ошибка:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Функция для отправки web push уведомлений
async function sendWebPushNotification(subscription: any, title: string, body: string, data: any) {
  const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const vapidEmail = Deno.env.get('VAPID_EMAIL')

  if (!vapidPublicKey || !vapidPrivateKey || !vapidEmail) {
    throw new Error('VAPID keys not configured')
  }

  const payload = JSON.stringify({
    title: title,
    body: body,
    data: data,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'hardwire-message'
  })

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Authorization': `vapid t=${vapidPublicKey}, k=${vapidPrivateKey}`,
      'Crypto-Key': `p256ecdsa=${vapidPublicKey}`
    },
    body: payload
  })

  if (!response.ok) {
    throw new Error(`Push notification failed: ${response.status}`)
  }

  console.log('Supabase Push: Web push уведомление отправлено успешно')
}
