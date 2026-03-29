export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      bot_files: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          file_path: string;
          file_url: string | null;
          year: string;
          category: string;
          file_type: string | null;
          file_size: number | null;
          description: string | null;
          summary: string | null;
          uploader: string | null;
          is_starred: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          file_path: string;
          file_url?: string | null;
          year: string;
          category: string;
          file_type?: string | null;
          file_size?: number | null;
          description?: string | null;
          summary?: string | null;
          uploader?: string | null;
          is_starred?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bot_files"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type BotFileRecord = Database["public"]["Tables"]["bot_files"]["Row"];
export type BotFileInsert = Database["public"]["Tables"]["bot_files"]["Insert"];
