// Generated from the live Supabase schema (project: Mahalli).
// Regenerate after migrations with:
//   supabase gen types typescript --project-id wolrnueoxodvezijyrbf > src/lib/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          meta: Json
          seller_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
          seller_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          meta?: Json
          seller_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcasts: {
        Row: {
          channel: Database["public"]["Enums"]["broadcast_channel"]
          created_at: string
          id: string
          message: string
          recipient_count: number
          segment: Database["public"]["Enums"]["broadcast_segment"]
          seller_id: string
          sent_at: string | null
          status: Database["public"]["Enums"]["broadcast_status"]
        }
        Insert: {
          channel?: Database["public"]["Enums"]["broadcast_channel"]
          created_at?: string
          id?: string
          message: string
          recipient_count?: number
          segment?: Database["public"]["Enums"]["broadcast_segment"]
          seller_id: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["broadcast_status"]
        }
        Update: {
          channel?: Database["public"]["Enums"]["broadcast_channel"]
          created_at?: string
          id?: string
          message?: string
          recipient_count?: number
          segment?: Database["public"]["Enums"]["broadcast_segment"]
          seller_id?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["broadcast_status"]
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          id: string
          seller_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          seller_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          seller_id?: string
          type?: Database["public"]["Enums"]["coupon_type"]
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          area: string | null
          created_at: string
          first_order_at: string | null
          flags: Json
          id: string
          last_order_at: string | null
          name: string | null
          order_count: number
          phone: string
          seller_id: string
          total_spent: number
        }
        Insert: {
          area?: string | null
          created_at?: string
          first_order_at?: string | null
          flags?: Json
          id?: string
          last_order_at?: string | null
          name?: string | null
          order_count?: number
          phone: string
          seller_id: string
          total_spent?: number
        }
        Update: {
          area?: string | null
          created_at?: string
          first_order_at?: string | null
          flags?: Json
          id?: string
          last_order_at?: string | null
          name?: string | null
          order_count?: number
          phone?: string
          seller_id?: string
          total_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      message_outbox: {
        Row: {
          attempts: number
          created_at: string
          dedupe_key: string | null
          id: string
          kind: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          seller_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          seller_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          dedupe_key?: string | null
          id?: string
          kind?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          seller_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_outbox_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          name_snapshot: string
          order_id: string
          price_snapshot: number
          product_id: string | null
          qty: number
          variant_id: string | null
        }
        Insert: {
          id?: string
          name_snapshot: string
          order_id: string
          price_snapshot: number
          product_id?: string | null
          qty: number
          variant_id?: string | null
        }
        Update: {
          id?: string
          name_snapshot?: string
          order_id?: string
          price_snapshot?: number
          product_id?: string | null
          qty?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_area: string | null
          buyer_name: string | null
          buyer_phone: string | null
          channel: Database["public"]["Enums"]["order_channel"]
          courier: string | null
          created_at: string
          customer_id: string | null
          delivery_fee: number
          id: string
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          seller_id: string
          status: Database["public"]["Enums"]["order_status"]
          stock_committed: boolean
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          buyer_area?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          channel?: Database["public"]["Enums"]["order_channel"]
          courier?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          seller_id: string
          status?: Database["public"]["Enums"]["order_status"]
          stock_committed?: boolean
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          buyer_area?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          channel?: Database["public"]["Enums"]["order_channel"]
          courier?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_fee?: number
          id?: string
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          seller_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          stock_committed?: boolean
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          id: string
          label: string
          price_override: number | null
          product_id: string
          sku: string | null
          stock: number
        }
        Insert: {
          id?: string
          label: string
          price_override?: number | null
          product_id: string
          sku?: string | null
          stock?: number
        }
        Update: {
          id?: string
          label?: string
          price_override?: number | null
          product_id?: string
          sku?: string | null
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          price: number
          seller_id: string
          stock: number
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          price?: number
          seller_id: string
          stock?: number
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          seller_id?: string
          stock?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          role: Database["public"]["Enums"]["profile_role"]
          seller_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["public"]["Enums"]["profile_role"]
          seller_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["public"]["Enums"]["profile_role"]
          seller_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          city: string | null
          contact_phone: string | null
          created_at: string
          delivery_areas: Json
          id: string
          lang: string
          logo_url: string | null
          name: string
          owner_user_id: string
          plan: Database["public"]["Enums"]["seller_plan"]
          slug: string
          theme: string
        }
        Insert: {
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          delivery_areas?: Json
          id?: string
          lang?: string
          logo_url?: string | null
          name: string
          owner_user_id: string
          plan?: Database["public"]["Enums"]["seller_plan"]
          slug: string
          theme?: string
        }
        Update: {
          city?: string | null
          contact_phone?: string | null
          created_at?: string
          delivery_areas?: Json
          id?: string
          lang?: string
          logo_url?: string | null
          name?: string
          owner_user_id?: string
          plan?: Database["public"]["Enums"]["seller_plan"]
          slug?: string
          theme?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          external_id: string
          id: string
          payload: Json
          processed_at: string | null
          signature_ok: boolean
          source: string
        }
        Insert: {
          created_at?: string
          external_id: string
          id?: string
          payload?: Json
          processed_at?: string | null
          signature_ok?: boolean
          source: string
        }
        Update: {
          created_at?: string
          external_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          signature_ok?: boolean
          source?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_message: {
        Args: { p_error?: string; p_id: string; p_next?: string; p_ok: boolean }
        Returns: undefined
      }
      dequeue_messages: {
        Args: { p_limit?: number }
        Returns: {
          attempts: number
          created_at: string
          dedupe_key: string | null
          id: string
          kind: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          seller_id: string
          status: string
          updated_at: string
        }[]
      }
      enqueue_message: {
        Args: {
          p_dedupe_key?: string
          p_kind: string
          p_payload?: Json
          p_seller: string
        }
        Returns: string
      }
      create_shop: {
        Args: {
          p_city?: string
          p_contact_phone?: string
          p_lang?: string
          p_logo_url?: string
          p_name: string
          p_slug: string
        }
        Returns: {
          city: string | null
          contact_phone: string | null
          created_at: string
          delivery_areas: Json
          id: string
          lang: string
          logo_url: string | null
          name: string
          owner_user_id: string
          plan: Database["public"]["Enums"]["seller_plan"]
          slug: string
        }
      }
      is_slug_available: { Args: { p_slug: string }; Returns: boolean }
      get_storefront: { Args: { p_slug: string }; Returns: Json }
      place_order: {
        Args: {
          p_slug: string
          p_buyer_name: string
          p_buyer_phone: string
          p_buyer_area: string | null
          p_items: Json
          p_hp?: string
        }
        Returns: string
      }
      slug_is_reserved: { Args: { p_slug: string }; Returns: boolean }
      set_order_status: {
        Args: {
          p_order: string
          p_status: Database["public"]["Enums"]["order_status"]
        }
        Returns: undefined
      }
      create_manual_order: {
        Args: {
          p_seller: string
          p_buyer_name: string
          p_buyer_phone: string
          p_buyer_area: string
          p_notes: string
          p_delivery_fee: number
          p_items: Json
        }
        Returns: string
      }
      save_product: {
        Args: {
          p_id: string | null
          p_seller: string
          p_name: string
          p_description: string | null
          p_price: number
          p_category: string | null
          p_image_url: string | null
          p_stock: number
          p_active: boolean
          p_variants: Json
        }
        Returns: string
      }
      user_is_owner: { Args: { target_seller: string }; Returns: boolean }
      user_seller_ids: { Args: Record<PropertyKey, never>; Returns: string[] }
    }
    Enums: {
      broadcast_channel: "wa_link" | "wa_cloud" | "sms"
      broadcast_segment: "all" | "repeat" | "recent"
      broadcast_status: "draft" | "queued" | "sending" | "sent" | "failed"
      coupon_type: "pct" | "fixed"
      order_channel: "storefront" | "manual"
      order_status: "new" | "confirmed" | "ready" | "out" | "delivered" | "cancelled"
      payment_method: "cod" | "prepaid"
      payment_status: "unpaid" | "paid" | "refunded"
      profile_role: "owner" | "staff"
      seller_plan: "free" | "growth" | "pro"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database["public"]

export type Tables<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Row"]
export type TablesInsert<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> =
  PublicSchema["Tables"][T]["Update"]
export type Enums<T extends keyof PublicSchema["Enums"]> =
  PublicSchema["Enums"][T]
