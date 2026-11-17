import { Database } from './database.types';

export type Product = Database['public']['Tables']['produtos']['Row'];

export type Category = Database['public']['Tables']['categorias']['Row'];

export type Campaign = Database['public']['Tables']['campanhas']['Row'];

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

export interface CampaignProductDiscount {
    produto_id: number;
    tipo: 'percentual' | 'fixo' | 'preco_fixo';
    valor: number;
}

export interface ProductVariant {
    tipo: string;
    opcoes: string[];
}
