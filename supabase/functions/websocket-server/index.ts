import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Хранилище активных WebSocket соединений
const connections = new Map<string, WebSocket>()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // WebSocket upgrade
    if (req.headers.get('upgrade') === 'websocket') {
      const { socket, response } = Deno.upgradeWebSocket(req)
      
      socket.onopen = () => {
        console.log('WebSocket: Новое соединение установлено')
      }
      
      socket.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('WebSocket: Получено сообщение:', data)
          
          if (data.type === 'auth') {
            // Сохраняем соединение с привязкой к пользователю
            connections.set(data.userId, socket)
            console.log('WebSocket: Пользователь авторизован:', data.userId)
            
            // Отправляем подтверждение
            socket.send(JSON.stringify({
              type: 'auth_success',
              message: 'Авторизация успешна'
            }))
          }
          
          if (data.type === 'message') {
            // Создаем клиент Supabase
            const supabaseClient = createClient(
              Deno.env.get('SUPABASE_URL') ?? '',
              Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            )
            
            // Сохраняем сообщение в базе данных
            const { data: messageData, error: messageError } = await supabaseClient
              .from('messages')
              .insert({
                sender_id: data.senderId,
                receiver_id: data.receiverId,
                message_text: data.messageText
              })
              .select()
              .single()
            
            if (messageError) {
              console.error('WebSocket: Ошибка сохранения сообщения:', messageError)
              socket.send(JSON.stringify({
                type: 'error',
                message: 'Ошибка сохранения сообщения'
              }))
              return
            }
            
            console.log('WebSocket: Сообщение сохранено:', messageData)
            
            // Отправляем сообщение получателю
            const receiverSocket = connections.get(data.receiverId)
            if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
              receiverSocket.send(JSON.stringify({
                type: 'new_message',
                message: {
                  id: messageData.id,
                  sender_id: messageData.sender_id,
                  receiver_id: messageData.receiver_id,
                  message_text: messageData.message_text,
                  created_at: messageData.created_at
                }
              }))
              console.log('WebSocket: Сообщение отправлено получателю:', data.receiverId)
            } else {
              console.log('WebSocket: Получатель не онлайн:', data.receiverId)
            }
            
            // Отправляем подтверждение отправителю
            socket.send(JSON.stringify({
              type: 'message_sent',
              messageId: messageData.id
            }))
          }
          
        } catch (error) {
          console.error('WebSocket: Ошибка обработки сообщения:', error)
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Ошибка обработки сообщения'
          }))
        }
      }
      
      socket.onclose = () => {
        console.log('WebSocket: Соединение закрыто')
        // Удаляем соединение из хранилища
        for (const [userId, conn] of connections.entries()) {
          if (conn === socket) {
            connections.delete(userId)
            console.log('WebSocket: Пользователь отключен:', userId)
            break
          }
        }
      }
      
      socket.onerror = (error) => {
        console.error('WebSocket: Ошибка соединения:', error)
      }
      
      return response
    }
    
    // HTTP запросы для получения сообщений
    if (url.pathname === '/messages') {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )
      
      const userId = url.searchParams.get('userId')
      const otherUserId = url.searchParams.get('otherUserId')
      
      if (!userId || !otherUserId) {
        return new Response(
          JSON.stringify({ error: 'Missing userId or otherUserId' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      const { data: messages, error } = await supabaseClient
        .from('messages')
        .select(`
          *,
          sender:users!messages_sender_id_fkey(name, avatar_url)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('WebSocket: Ошибка получения сообщений:', error)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch messages' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ messages }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    // Статус сервера
    if (url.pathname === '/status') {
      return new Response(
        JSON.stringify({ 
          status: 'running',
          connections: connections.size,
          timestamp: new Date().toISOString()
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }
    
    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('WebSocket Server: Ошибка:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
