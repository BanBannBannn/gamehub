export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      game_sessions: {
        Row: {
          id: string;
          user_id: string;
          game_slug: string;
          difficulty: string | null;
          duration_seconds: number | null;
          hints_used: number;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_slug: string;
          difficulty?: string | null;
          duration_seconds?: number | null;
          hints_used?: number;
          completed?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_slug?: string;
          difficulty?: string | null;
          duration_seconds?: number | null;
          hints_used?: number;
          completed?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      rooms: {
        Row: {
          id: string;
          code: string;
          game_slug: string;
          status: string;
          max_players: number;
          host_user_id: string | null;
          host_guest_id: string | null;
          round_number: number;
          scoreboard: Record<string, number>;
          game_state: unknown;
          settings: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          game_slug: string;
          status?: string;
          max_players: number;
          host_user_id?: string | null;
          host_guest_id?: string | null;
          round_number?: number;
          scoreboard?: Record<string, number>;
          game_state?: unknown;
          settings?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          game_slug?: string;
          status?: string;
          max_players?: number;
          host_user_id?: string | null;
          host_guest_id?: string | null;
          round_number?: number;
          scoreboard?: Record<string, number>;
          game_state?: unknown;
          settings?: Record<string, unknown> | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      room_players: {
        Row: {
          id: string;
          room_id: string;
          slot: number;
          user_id: string | null;
          guest_id: string | null;
          display_name: string;
          is_ready: boolean;
          is_connected: boolean;
          joined_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          slot: number;
          user_id?: string | null;
          guest_id?: string | null;
          display_name: string;
          is_ready?: boolean;
          is_connected?: boolean;
          joined_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          slot?: number;
          user_id?: string | null;
          guest_id?: string | null;
          display_name?: string;
          is_ready?: boolean;
          is_connected?: boolean;
          joined_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
