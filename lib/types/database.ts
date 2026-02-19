// ─────────────────────────────────────────────────────────────────
// Database types matching the Supabase schema for njob_creator
// Generated from the real Supabase OpenAPI spec
// ─────────────────────────────────────────────────────────────────

// ─── Enums ───────────────────────────────────────────────────────

export type TypeNotification = 'Sucesso' | 'Alerta' | 'Erro' | 'Informacao'
export type PaginaSelect =
  | 'Conteudo'
  | 'Cupons'
  | 'Suporte'
  | 'Perfil'
  | 'Home'
  | 'Agenda'
  | 'Chat'
  | 'Notificacoes'
  | 'Empty'
export type TypeEventos = 'live' | 'call'
export type DiscountType = 'percentage' | 'fixed'
export type UserRole = 'creator' | 'client' | 'admin'
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

// ─── Core structs (mirrors Flutter structs / edge function responses) ──

export interface ProfileCreator {
  username: string
  full_name: string
  avatar_url: string
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
  whatsapp: string
}

export interface CreatorDescription {
  idade: number | null
  date_birth: string | null
  cidade: string | null
  eu_sou: string | null
  por: string | null
  me_considero: string | null
  adoro: string | null
  pessoas_que: string | null
  gender: string | null
  created_at: string
  updated_at: string
}

export interface BankAccount {
  id: string
  last4: string
  status: string
  country: string
  currency: string
  bank_name: string
  routing_number: string
  default_for_currency: boolean
}

export interface AccountDetails {
  bank_account: BankAccount | null
  last_synced_at: string
  charges_enabled: boolean
  payouts_enabled: boolean
  stripe_account_id: string
}

export interface ImagesCreator {
  highlight_image_url: boolean
  image_url: string
}

export interface CreatorData {
  profile: ProfileCreator
  creator_description: CreatorDescription | null
  images: ImagesCreator[]
  plan_name: string | null
  has_active_plan: boolean
  plan_stripe_id: string | null
  account_details: AccountDetails | null
}

export interface PacksData {
  pack_id: string
  cover_image_url: string
  title: string
  price: number
  photo_count: number
  video_count: number
}

export interface CouponData {
  id: string
  code: string
  image_url: string
  valid_from: string
  valid_until: string
  description: string
  discount_type: DiscountType
  discount_value: number
  store_name: string
}

export interface RevenueBreakdown {
  live_revenue: number
  call_revenue: number
  content_revenue: number
  subscription_revenue: number
}

export interface StatementData {
  revenue_breakdown: RevenueBreakdown
  available_for_payout: number
  future_payouts: number
  completed_payouts: number
}

export interface TimeSlot {
  id: string
  slot_time: string
  period_of_day: string
  purchased: boolean
}

export interface AvailabilityData {
  date: string
  slots: TimeSlot[]
}

export interface LoginData {
  email: string
  password: string
  remember: boolean
}

// ─── Database Row Types ────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          role: string
          is_active: boolean | null
          whatsapp: string | null
          date_birth: string | null
          aprove: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role: string
          is_active?: boolean | null
          whatsapp?: string | null
          date_birth?: string | null
          aprove?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: string
          is_active?: boolean | null
          whatsapp?: string | null
          date_birth?: string | null
          aprove?: string | null
          updated_at?: string | null
        }
      }
      profile_images: {
        Row: {
          id: string
          profile_id: string
          highlight_image_url: boolean
          image_url: string
          created_at: string
          index: number | null
        }
        Insert: {
          id?: string
          profile_id: string
          highlight_image_url: boolean
          image_url: string
          created_at?: string
          index?: number | null
        }
        Update: {
          highlight_image_url?: boolean
          image_url?: string
          index?: number | null
        }
      }
      profile_documents: {
        Row: {
          id: string
          profile_id: string
          type: string
          number: string | null
          front_image_url: string
          back_image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          type: string
          number?: string | null
          front_image_url: string
          back_image_url: string
          created_at?: string
        }
        Update: {
          type?: string
          number?: string | null
          front_image_url?: string
          back_image_url?: string
        }
      }
      profile_settings: {
        Row: {
          id: string
          profile_id: string
          sell_packs: boolean
          sell_stream: boolean
          sell_calls: boolean
          face_to_face_meeting: boolean
          call_per_30_min: number
          call_per_1_hr: number
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          sell_packs: boolean
          sell_stream: boolean
          sell_calls: boolean
          face_to_face_meeting: boolean
          call_per_30_min: number
          call_per_1_hr: number
          created_at?: string
        }
        Update: {
          sell_packs?: boolean
          sell_stream?: boolean
          sell_calls?: boolean
          face_to_face_meeting?: boolean
          call_per_30_min?: number
          call_per_1_hr?: number
        }
      }
      profile_views: {
        Row: {
          id: string
          profile_id: string
          viewed_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          viewed_at?: string
        }
        Update: Record<string, never>
      }
      creator_description: {
        Row: {
          id: string
          profile_id: string
          idade: number
          cidade: string
          eu_sou: string
          por: string
          me_considero: string
          adoro: string
          pessoas_que: string
          gender: string | null
          date_birth: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          idade: number
          cidade: string
          eu_sou: string
          por: string
          me_considero: string
          adoro: string
          pessoas_que: string
          gender?: string | null
          date_birth?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          idade?: number
          cidade?: string
          eu_sou?: string
          por?: string
          me_considero?: string
          adoro?: string
          pessoas_que?: string
          gender?: string | null
          date_birth?: string | null
          updated_at?: string | null
        }
      }
      creator_availability: {
        Row: {
          id: string
          creator_id: string
          is_active: boolean | null
          availability_date: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          is_active?: boolean | null
          availability_date: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          is_active?: boolean | null
          availability_date?: string
          updated_at?: string | null
        }
      }
      creator_availability_slots: {
        Row: {
          id: string
          availability_id: string
          slot_time: string
          period_of_day: string
          purchased: boolean | null
        }
        Insert: {
          id?: string
          availability_id: string
          slot_time: string
          period_of_day: string
          purchased?: boolean | null
        }
        Update: {
          slot_time?: string
          period_of_day?: string
          purchased?: boolean | null
        }
      }
      creator_payout_info: {
        Row: {
          creator_id: string
          payout_method: string
          account_details: AccountDetails
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          creator_id: string
          payout_method: string
          account_details: AccountDetails
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          payout_method?: string
          account_details?: AccountDetails
          status?: string | null
          updated_at?: string | null
        }
      }
      creator_subscriptions: {
        Row: {
          id: string
          creator_id: string
          plan_id: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          gateway_subscription_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          plan_id: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          gateway_subscription_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          gateway_subscription_id?: string | null
          updated_at?: string | null
        }
      }
      creator_favorites: {
        Row: {
          id: string
          client_id: string
          creator_id: string
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          creator_id: string
          created_at?: string
        }
        Update: Record<string, never>
      }
      creator_notification_settings: {
        Row: {
          id: string
          creator_id: string
          client_id: string
          notify_online: boolean | null
          notify_new_content: boolean | null
          notify_live_scheduled: boolean | null
          notify_live_started: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          client_id: string
          notify_online?: boolean | null
          notify_new_content?: boolean | null
          notify_live_scheduled?: boolean | null
          notify_live_started?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          notify_online?: boolean | null
          notify_new_content?: boolean | null
          notify_live_scheduled?: boolean | null
          notify_live_started?: boolean | null
          updated_at?: string | null
        }
      }
      packs: {
        Row: {
          id: string
          profile_id: string
          title: string
          description: string | null
          price: number
          currency: string
          cover_image_url: string | null
          status: string
          published_at: string | null
          stripe_product_id: string | null
          stripe_price_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          profile_id: string
          title: string
          description?: string | null
          price: number
          currency: string
          cover_image_url?: string | null
          status: string
          published_at?: string | null
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          price?: number
          currency?: string
          cover_image_url?: string | null
          status?: string
          published_at?: string | null
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
      }
      pack_items: {
        Row: {
          id: string
          pack_id: string
          item_type: string
          file_url: string
          file_name: string | null
          file_size_bytes: number | null
          thumbnail_url: string | null
          item_order: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          pack_id: string
          item_type: string
          file_url: string
          file_name?: string | null
          file_size_bytes?: number | null
          thumbnail_url?: string | null
          item_order?: number | null
          created_at?: string | null
        }
        Update: {
          item_type?: string
          file_url?: string
          file_name?: string | null
          file_size_bytes?: number | null
          thumbnail_url?: string | null
          item_order?: number | null
        }
      }
      pack_purchases: {
        Row: {
          id: string
          user_id: string
          pack_id: string
          transaction_id: string | null
          purchase_price: number
          currency: string
          status: string
          purchased_at: string | null
          coupon_used_id: string | null
          platform_fee: number | null
          creator_share: number | null
        }
        Insert: {
          id?: string
          user_id: string
          pack_id: string
          transaction_id?: string | null
          purchase_price: number
          currency: string
          status: string
          purchased_at?: string | null
          coupon_used_id?: string | null
          platform_fee?: number | null
          creator_share?: number | null
        }
        Update: {
          status?: string
          transaction_id?: string | null
          platform_fee?: number | null
          creator_share?: number | null
        }
      }
      live_streams: {
        Row: {
          id: string
          creator_id: string
          title: string
          description: string | null
          scheduled_start_time: string
          estimated_duration_minutes: number | null
          actual_start_time: string | null
          actual_end_time: string | null
          ticket_price: number
          currency: string
          participant_limit: number | null
          stream_url: string | null
          cover_image_url: string | null
          status: string
          stripe_product_id: string | null
          stripe_price_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          title: string
          description?: string | null
          scheduled_start_time: string
          estimated_duration_minutes?: number | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          ticket_price: number
          currency: string
          participant_limit?: number | null
          stream_url?: string | null
          cover_image_url?: string | null
          status: string
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          title?: string
          description?: string | null
          scheduled_start_time?: string
          estimated_duration_minutes?: number | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          ticket_price?: number
          currency?: string
          participant_limit?: number | null
          stream_url?: string | null
          cover_image_url?: string | null
          status?: string
          stripe_product_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
      }
      live_stream_tickets: {
        Row: {
          id: string
          user_id: string
          live_stream_id: string
          transaction_id: string | null
          purchase_price: number
          currency: string
          status: string
          purchased_at: string | null
          coupon_used_id: string | null
          platform_fee: number | null
          creator_share: number | null
        }
        Insert: {
          id?: string
          user_id: string
          live_stream_id: string
          transaction_id?: string | null
          purchase_price: number
          currency: string
          status: string
          purchased_at?: string | null
          coupon_used_id?: string | null
          platform_fee?: number | null
          creator_share?: number | null
        }
        Update: {
          status?: string
          transaction_id?: string | null
          platform_fee?: number | null
          creator_share?: number | null
        }
      }
      one_on_one_calls: {
        Row: {
          id: string
          user_id: string
          creator_id: string
          availability_slot_id: string | null
          scheduled_start_time: string
          scheduled_duration_minutes: number
          scheduled_end_time: string | null
          actual_start_time: string | null
          actual_end_time: string | null
          call_price: number
          currency: string
          status: string
          transaction_id: string | null
          coupon_used_id: string | null
          platform_fee: number | null
          creator_share: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          creator_id: string
          availability_slot_id?: string | null
          scheduled_start_time: string
          scheduled_duration_minutes: number
          scheduled_end_time?: string | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          call_price: number
          currency: string
          status: string
          transaction_id?: string | null
          coupon_used_id?: string | null
          platform_fee?: number | null
          creator_share?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          scheduled_start_time?: string
          scheduled_end_time?: string | null
          actual_start_time?: string | null
          actual_end_time?: string | null
          status?: string
          transaction_id?: string | null
          platform_fee?: number | null
          creator_share?: number | null
          updated_at?: string | null
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          description: string | null
          discount_type: string
          discount_value: number
          max_uses: number | null
          usage_count: number | null
          scope: string
          valid_from: string | null
          valid_until: string | null
          applicable_pack_id: string | null
          applicable_live_id: string | null
          applicable_call_id: string | null
          image_url: string | null
          store_name: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          code: string
          description?: string | null
          discount_type: string
          discount_value: number
          max_uses?: number | null
          usage_count?: number | null
          scope: string
          valid_from?: string | null
          valid_until?: string | null
          applicable_pack_id?: string | null
          applicable_live_id?: string | null
          applicable_call_id?: string | null
          image_url?: string | null
          store_name?: string | null
          created_at?: string | null
        }
        Update: {
          code?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          max_uses?: number | null
          usage_count?: number | null
          scope?: string
          valid_from?: string | null
          valid_until?: string | null
          applicable_pack_id?: string | null
          applicable_live_id?: string | null
          applicable_call_id?: string | null
          image_url?: string | null
          store_name?: string | null
        }
      }
      coupon_usage: {
        Row: {
          id: string
          coupon_id: string
          user_id: string
          purchase_id: string | null
          ticket_id: string | null
          call_id: string | null
          used_at: string | null
        }
        Insert: {
          id?: string
          coupon_id: string
          user_id: string
          purchase_id?: string | null
          ticket_id?: string | null
          call_id?: string | null
          used_at?: string | null
        }
        Update: Record<string, never>
      }
      conversations: {
        Row: {
          id: string
          is_group: boolean
          title: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_group: boolean
          title?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          is_group?: boolean
          title?: string | null
          updated_at?: string
        }
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          profile_id: string
          last_read_at: string | null
          joined_at: string
        }
        Insert: {
          conversation_id: string
          profile_id: string
          last_read_at?: string | null
          joined_at?: string
        }
        Update: {
          last_read_at?: string | null
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          content: string
          attachments: Record<string, unknown> | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          sender_id: string
          content: string
          attachments?: Record<string, unknown> | null
          created_at?: string
        }
        Update: {
          content?: string
          attachments?: Record<string, unknown> | null
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          related_purchase_id: string | null
          related_ticket_id: string | null
          related_call_id: string | null
          amount: number
          currency: string
          gateway: string
          gateway_transaction_id: string | null
          status: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          related_purchase_id?: string | null
          related_ticket_id?: string | null
          related_call_id?: string | null
          amount: number
          currency: string
          gateway: string
          gateway_transaction_id?: string | null
          status: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          status?: string
          gateway_transaction_id?: string | null
          updated_at?: string | null
        }
      }
      payouts: {
        Row: {
          id: string
          creator_id: string
          amount: number
          currency: string
          status: string
          requested_at: string | null
          processed_at: string | null
          transaction_reference: string | null
          processed_by: string | null
          notes: string | null
          idempotency_key: string | null
        }
        Insert: {
          id?: string
          creator_id: string
          amount: number
          currency: string
          status: string
          requested_at?: string | null
          processed_at?: string | null
          transaction_reference?: string | null
          processed_by?: string | null
          notes?: string | null
          idempotency_key?: string | null
        }
        Update: {
          status?: string
          processed_at?: string | null
          transaction_reference?: string | null
          processed_by?: string | null
          notes?: string | null
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          description: string | null
          price_monthly: number
          price_yearly: number | null
          currency: string
          features: Record<string, unknown> | null
          stripe_price_id: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price_monthly: number
          price_yearly?: number | null
          currency: string
          features?: Record<string, unknown> | null
          stripe_price_id?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          name?: string
          description?: string | null
          price_monthly?: number
          price_yearly?: number | null
          currency?: string
          features?: Record<string, unknown> | null
          stripe_price_id?: string | null
          is_active?: boolean | null
          updated_at?: string | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string | null
          message: string
          data: Record<string, unknown> | null
          is_read: boolean | null
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title?: string | null
          message: string
          data?: Record<string, unknown> | null
          is_read?: boolean | null
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          is_read?: boolean | null
          read_at?: string | null
        }
      }
      content_likes: {
        Row: {
          id: string
          creator_id: string
          client_id: string
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          client_id: string
          created_at?: string
        }
        Update: Record<string, never>
      }
      platform_settings: {
        Row: {
          key: string
          value: Record<string, unknown>
          description: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          key: string
          value: Record<string, unknown>
          description?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          value?: Record<string, unknown>
          description?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
      }
      processed_webhook_events: {
        Row: {
          id: string
          created_at: string | null
        }
        Insert: {
          id: string
          created_at?: string | null
        }
        Update: Record<string, never>
      }
    }
    Views: {
      vw_messages: {
        Row: {
          message_id: string | null
          conversation_id: string | null
          sender_id: string | null
          content: string | null
          created_at: string | null
          client_id: string | null
          client_last_read_at: string | null
          is_read_by_client: boolean | null
          is_read_by_creator: boolean | null
        }
      }
      vw_creator_conversations: {
        Row: {
          conversation_id: string | null
          profile_id: string | null
          profile_last_read_at: string | null
          peer_id: string | null
          peer_name: string | null
          peer_avatar_url: string | null
          last_message: string | null
          last_message_time: string | null
          last_message_read_by_client: boolean | null
          unread_count: number | null
          last_message_created_at: string | null
        }
      }
      vw_creator_events: {
        Row: {
          event_id: string | null
          creator_id: string | null
          event_name: string | null
          event_type: string | null
          start_date: string | null
          time: string | null
          duration_min: number | null
          attendee_count: number | null
          title: string | null
        }
      }
      total_gasto_cliente: {
        Row: {
          user_id: string | null
          total_amount: number | null
        }
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
