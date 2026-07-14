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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
