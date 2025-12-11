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
      conversation_analyses: {
        Row: {
          id: string;
          user_id: string;
          input_text: string;
          score: number;
          summary: string;
          you_effort: number;
          them_effort: number;
          greens: string[] | null;
          reds: string[] | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          input_text: string;
          score: number;
          summary: string;
          you_effort: number;
          them_effort: number;
          greens?: string[] | null;
          reds?: string[] | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          input_text?: string;
          score?: number;
          summary?: string;
          you_effort?: number;
          them_effort?: number;
          greens?: string[] | null;
          reds?: string[] | null;
          created_at?: string;
        };
      };
    };
  };
}
