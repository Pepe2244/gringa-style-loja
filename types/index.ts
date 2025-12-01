import { Database } from './database.types';

export type Product = Database['public']['Tables']['produtos']['Row'];

export type Category = Database['public']['Tables']['categorias']['Row'];

export interface CartItem {
    produto_id: number;
    quantidade: number;
    variante?: {
        tipo: string;
        opcao: string;
    } | null;
}

export type Rifa = Database['public']['Tables']['rifas']['Row'];

export type Premio = Database['public']['Tables']['premios']['Row'];

export type ParticipanteRifa = Database['public']['Tables']['participantes_rifa']['Row'];
