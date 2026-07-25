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
      player_stats: {
        Row: {
          user_id: string;
          game_slug: string;
          display_name: string;
          rating: number;
          wins: number;
          losses: number;
          draws: number;
          games: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          game_slug: string;
          display_name: string;
          rating?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          games?: number;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          game_slug?: string;
          display_name?: string;
          rating?: number;
          wins?: number;
          losses?: number;
          draws?: number;
          games?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      room_round_history: {
        Row: {
          id: string;
          room_id: string;
          room_code: string;
          game_slug: string;
          round_number: number;
          final_game_state: unknown;
          winner_slot: number | null;
          players: unknown;
          finished_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          room_code: string;
          game_slug: string;
          round_number: number;
          final_game_state?: unknown;
          winner_slot?: number | null;
          players: unknown;
          finished_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          room_code?: string;
          game_slug?: string;
          round_number?: number;
          final_game_state?: unknown;
          winner_slot?: number | null;
          players?: unknown;
          finished_at?: string;
        };
        Relationships: [];
      };
      run_records: {
        Row: {
          user_id: string;
          game_slug: string;
          display_name: string;
          best_rooms_cleared: number;
          best_time_ms: number | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          game_slug: string;
          display_name: string;
          best_rooms_cleared?: number;
          best_time_ms?: number | null;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          game_slug?: string;
          display_name?: string;
          best_rooms_cleared?: number;
          best_time_ms?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
