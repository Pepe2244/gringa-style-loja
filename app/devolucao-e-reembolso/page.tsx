import React from 'react';
import { ShieldCheck, ArrowLeftRight, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DevolucaoReembolsoPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-black text-zinc-950 tracking-tighter italic uppercase italic">
            Trocas e Devoluções
          </h1>
          <p className="mt-4 text-lg text-zinc-600 font-medium font-roboto">
            O ramo da solda é decidido. Nós respeitamos sua confiança e garantimos seus direitos.
          </p>
        </div>

        <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-zinc-200">
          <div className="px-6 py-8 sm:p-10 space-y-12 text-zinc-800">
            
            <section className="relative pl-10 border-l-4 border-orange-600">
              <div className="absolute -left-[18px] top-0 bg-white p-1">
                <Clock className="h-7 w-7 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-4 uppercase font-teko tracking-widest">1. Direito de Arrependimento</h2>
              <p className="leading-relaxed font-roboto">
                Comprou e mudou de ideia? Pelo Código de Defesa do Consumidor, você tem <strong>7 (sete) dias corridos</strong> após o recebimento para solicitar a devolução.
              </p>
              <ul className="mt-4 space-y-2 list-disc list-inside text-sm text-zinc-500">
                <li>O produto deve estar na embalagem original e sem indícios de uso.</li>
                <li>O custo do frete de retorno é por conta da Gringa Style.</li>
              </ul>
            </section>

            <section className="relative pl-10 border-l-4 border-orange-600">
              <div className="absolute -left-[18px] top-0 bg-white p-1">
                <ShieldCheck className="h-7 w-7 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-4 uppercase font-teko tracking-widest">2. Defeitos de Fabricação</h2>
              <p className="leading-relaxed font-roboto">
                A precisão é o nosso foco. Se seu equipamento apresentar falhas técnicas:
              </p>
              <ul className="mt-4 space-y-2 list-disc list-inside text-sm text-zinc-500">
                <li>Garantia legal de <strong>90 dias</strong>.</li>
                <li>Análise técnica concluída em até 30 dias após o recebimento.</li>
              </ul>
            </section>

            <section className="bg-orange-50 p-8 rounded-2xl border-2 border-orange-100">
              <div className="flex items-center mb-4">
                <AlertCircle className="h-6 w-6 text-orange-600 mr-2" />
                <h2 className="text-xl font-bold text-zinc-900 uppercase font-teko tracking-widest">3. Máscaras Personalizadas</h2>
              </div>
              <p className="text-sm leading-relaxed text-zinc-700 italic font-roboto">
                Atenção Soldador: Máscaras feitas sob encomenda são exclusivas. Devoluções só são aceitas em caso de erro na personalização ou defeito técnico.
              </p>
            </section>

            <section className="relative pl-10 border-l-4 border-orange-600">
              <div className="absolute -left-[18px] top-0 bg-white p-1">
                <ArrowLeftRight className="h-7 w-7 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-4 uppercase font-teko tracking-widest">4. Como solicitar</h2>
              <p className="mb-6 font-roboto">Entre em contato direto com quem entende:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-zinc-50 rounded-xl border border-zinc-200">
                  <span className="font-bold block text-orange-600 uppercase text-xs mb-1">E-mail Oficial</span>
                  <p className="text-sm font-bold text-zinc-900">nalessogtaw015@gmail.com</p>
                </div>
                <div className="p-5 bg-zinc-50 rounded-xl border border-zinc-200">
                  <span className="font-bold block text-orange-600 uppercase text-xs mb-1">Suporte</span>
                  <p className="text-sm font-bold text-zinc-900">WhatsApp Gringa Style</p>
                </div>
              </div>
            </section>

            <section className="relative pl-10 border-l-4 border-orange-600">
              <div className="absolute -left-[18px] top-0 bg-white p-1">
                <CheckCircle2 className="h-7 w-7 text-orange-600" />
              </div>
              <h2 className="text-2xl font-bold text-zinc-950 mb-4 uppercase font-teko tracking-widest">5. Reembolso</h2>
              <p className="leading-relaxed font-roboto">
                O estorno ocorre pelo mesmo método da compra: <br />
                <strong>Pix:</strong> Em até 48h. <br />
                <strong>Cartão:</strong> Estorno em até 2 faturas dependendo da operadora.
              </p>
            </section>

          </div>
          <div className="px-6 py-4 bg-zinc-100 text-right">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Consistência e Estilo Gringa Style - 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
}