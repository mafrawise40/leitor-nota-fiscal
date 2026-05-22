'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Trash2, Trophy, Store, TrendingDown, Calendar } from 'lucide-react';

export default function ComparadorPage() {
    const [termoBusca, setTermoBusca] = useState('');
    const [meusFiltros, setMeusFiltros] = useState<string[]>([]);
    const [resultados, setResultados] = useState<{ [key: string]: any[] }>({});
    const [ranking, setRanking] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);

    // 1. Carrega os filtros salvos no banco ao abrir a página
    useEffect(() => {
        const inicializar = async () => {
            const res = await fetch('/api/filtros');
            const data = await res.json();
            if (data.success) {
                const termos = data.data.map((f: any) => f.termo);
                setMeusFiltros(termos);
                // Busca preços para cada termo recuperado
                termos.forEach((t: string) => buscarPrecos(t));
            }
            setLoading(false);
        };
        inicializar();
    }, []);

    const buscarPrecos = async (termo: string) => {
        const res = await fetch(`/api/comparador?termo=${termo}`);
        const data = await res.json();
        if (data.success) {
            setResultados(prev => ({ ...prev, [termo]: data.data }));
        }
    };

    const adicionarFiltro = async () => {
        const termoFormatado = termoBusca.toUpperCase().trim();
        if (termoFormatado && !meusFiltros.includes(termoFormatado)) {
            // Salva no Banco de Dados
            await fetch('/api/filtros', {
                method: 'POST',
                body: JSON.stringify({ termo: termoFormatado })
            });
            setMeusFiltros([...meusFiltros, termoFormatado]);
            buscarPrecos(termoFormatado);
            setTermoBusca('');
        }
    };

    const removerFiltro = async (termo: string) => {
        await fetch('/api/filtros', {
            method: 'DELETE',
            body: JSON.stringify({ termo })
        });
        setMeusFiltros(prev => prev.filter(f => f !== termo));
        setResultados(prev => {
            const copy = { ...prev };
            delete copy[termo];
            return copy;
        });
    };

    useEffect(() => {
        const novoRanking: { [key: string]: number } = {};
        Object.values(resultados).forEach(itens => {
            if (itens?.[0]) {
                const n1 = itens[0].estabelecimentoId?.nome;
                novoRanking[n1] = (novoRanking[n1] || 0) + 2;
            }
            if (itens?.[1]) {
                const n2 = itens[1].estabelecimentoId?.nome;
                novoRanking[n2] = (novoRanking[n2] || 0) + 1;
            }
        });
        setRanking(novoRanking);
    }, [resultados]);

    return (
        <main className="min-h-screen bg-[#F8F9FA] pb-32 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header Compacto */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">
                        Monitor de <span className="text-green-600">Economia</span>
                    </h1>

                    <div className="flex gap-2">
                        <div className="bg-white border rounded-full px-4 py-2 flex items-center shadow-sm w-full md:w-64">
                            <Search size={16} className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="OVO 30, FRANGO..."
                                className="bg-transparent text-xs font-bold outline-none w-full"
                                value={termoBusca}
                                onChange={(e) => setTermoBusca(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && adicionarFiltro()}
                            />
                        </div>
                        <button onClick={adicionarFiltro} className="bg-black text-white p-2 rounded-full hover:bg-green-600 transition-all">
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Ranking Minimalista */}
                {Object.keys(ranking).length > 0 && (
                    <div className="bg-white rounded-3xl border border-gray-100 p-6 mb-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="text-yellow-500" size={18} />
                            <h2 className="text-xs font-black uppercase text-gray-400 tracking-widest">Melhores Opções para Compra do Mês</h2>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(ranking)
                                .sort(([, a], [, b]) => b - a)
                                .map(([nome, pontos], idx) => (
                                    <div key={nome} className="bg-gray-50 border px-4 py-2 rounded-xl flex items-center gap-3">
                                        <span className="text-[10px] font-black text-gray-300">#{idx + 1}</span>
                                        <span className="text-xs font-bold text-gray-700 uppercase">{nome}</span>
                                        <span className="bg-green-100 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-md">{pontos} PTS</span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Grid de Tabelas - 2 colunas no desktop para economizar espaço */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {meusFiltros.map(filtro => (
                        <section key={filtro} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                            <div className="px-5 py-3 bg-gray-50/50 border-b flex justify-between items-center">
                                <div className="flex items-center gap-2 font-black text-[11px] text-gray-800 uppercase tracking-tight">
                                    <TrendingDown size={14} className="text-green-600" /> {filtro}
                                </div>
                                <button onClick={() => removerFiltro(filtro)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            <div className="flex-1">
                                {resultados[filtro]?.map((item, index) => (
                                    <div key={item._id} className={`flex items-center justify-between p-4 border-b border-gray-50 last:border-0 ${index === 0 ? 'bg-green-50/30' : ''}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-6 text-[10px] font-black text-gray-300">
                                                {index === 0 ? <Trophy size={14} className="text-yellow-500" /> : `${index + 1}º`}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-[10px] font-black text-gray-900 uppercase truncate">
                                                    {item.estabelecimentoId?.nome}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase truncate">
                                                    {item.descricao}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col items-end shrink-0">
                                            <span className={`text-sm font-black ${index === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                                                R$ {item.valorUnitario.toFixed(2)}
                                            </span>
                                            <span className="text-[8px] font-bold text-gray-400 flex items-center gap-1">
                                                <Calendar size={8} /> {new Date(item.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {(!resultados[filtro] || resultados[filtro].length === 0) && (
                                    <div className="p-8 text-center text-[10px] font-bold text-gray-300 uppercase">Nenhum item encontrado</div>
                                )}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </main>
    );
}