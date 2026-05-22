'use client';

import { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Calendar, Store, Receipt, Info, X, Loader2, Search, Trash2, Filter } from 'lucide-react';

export default function HistoricoPage() {
    const [cupons, setCupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCupom, setSelectedCupom] = useState<any>(null);
    const [itens, setItens] = useState<any[]>([]);
    const [loadingItens, setLoadingItens] = useState(false);

    // Estado para o filtro de mês (Formato: "YYYY-MM")
    const [filtroMes, setFiltroMes] = useState(new Date().toISOString().substring(0, 7));

    useEffect(() => {
        fetch('/api/cupons')
            .then(res => res.json())
            .then(data => {
                if (data.success)
                    console.log(data.data);
                setCupons(data.data);
                setLoading(false);
            });
    }, []);

    // 1. Filtragem dos cupons por mês
    const cuponsFiltrados = useMemo(() => {
        return cupons.filter(c => c.updatedAt.startsWith(filtroMes));
    }, [cupons, filtroMes]);

    // 2. Somatório dos cupons filtrados
    const totalNoMes = useMemo(() => {
        return cuponsFiltrados.reduce((acc, curr) => acc + curr.valorTotal, 0);
    }, [cuponsFiltrados]);

    const excluirCupom = async (id: string) => {
        if (!confirm("Deseja realmente excluir este cupom e todos os seus itens?")) return;

        try {
            const res = await fetch(`/api/cupons?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCupons(prev => prev.filter(c => c._id !== id));
                alert("Cupom removido!");
            }
        } catch (err) {
            alert("Erro ao excluir.");
        }
    };

    const abrirModal = async (cupom: any) => {
        setSelectedCupom(cupom);
        setLoadingItens(true);
        setItens([]);
        try {
            const res = await fetch(`/api/cupons/itens?id=${cupom._id}`);
            const data = await res.json();
            if (data.success) setItens(data.data);
        } finally {
            setLoadingItens(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            <header className="bg-white border-b sticky top-0 z-20">
                <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Receipt className="text-green-600" /> MEU HISTÓRICO
                    </h1>

                    {/* Filtro de Mês */}
                    <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-2xl">
                        <Filter size={18} className="text-gray-500 ml-2" />
                        <input
                            type="month"
                            value={filtroMes}
                            onChange={(e) => setFiltroMes(e.target.value)}
                            className="bg-transparent font-bold text-gray-700 outline-none"
                        />
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto p-6">
                {/* Card de Resumo do Mês */}
                <div className="bg-green-600 rounded-[2rem] p-8 mb-10 text-white shadow-xl shadow-green-100 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <p className="text-green-100 font-bold uppercase text-xs tracking-widest">Gasto Total no Período</p>
                        <h2 className="text-5xl font-black font-mono mt-1">
                            <small className="text-xl mr-2">R$</small>{totalNoMes.toFixed(2)}
                        </h2>
                    </div>
                    <div className="bg-white/10 px-6 py-4 rounded-3xl backdrop-blur-md">
                        <p className="text-sm font-bold">{cuponsFiltrados.length} notas encontradas</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-20 text-green-600"><Loader2 className="animate-spin" size={40} /></div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cuponsFiltrados.map((c) => (
                            <div key={c._id} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 hover:shadow-xl transition-all group relative">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-gray-100 p-3 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
                                        <Store size={24} />
                                    </div>
                                    <button
                                        onClick={() => excluirCupom(c._id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>

                                {/* Nome do Estabelecimento Populado */}
                                <h3 className="font-black text-gray-800 uppercase text-lg leading-tight break-words min-h-[3rem] flex items-center">
                                    {c.estabelecimentoId?.nomeCurto || c.estabelecimentoId?.nome || "Mercado Desconhecido"}
                                </h3>

                                <div className="flex items-start gap-1 mt-1 mb-4 text-gray-500">
                                    <div className="mt-0.5 shrink-0">
                                        <svg xmlns="http://www.w3.org/2000/svg"  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map-pin"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.74a1.278 1.278 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" /><circle cx="12" cy="10" r="3" /></svg>
                                    </div>
                                    <p className="text-[10px] font-bold uppercase leading-relaxed tracking-wide">
                                        {c.estabelecimentoId?.endereco || "Endereço não informado"}
                                    </p>
                                </div>

                                <div className="flex justify-between items-end mt-4 mb-6">
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold flex items-center gap-1">
                                            <Calendar size={12} /> {new Date(c.dataEmissao).toLocaleDateString('pt-BR')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] text-gray-400 font-black uppercase">Total</span>
                                        <p className="text-xl font-black text-gray-900 font-mono leading-none">R$ {c.valorTotal.toFixed(2)}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => abrirModal(c)}
                                    className="w-full bg-gray-100 text-gray-900 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 hover:text-white transition-all"
                                >
                                    <Search size={18} /> VER DETALHES
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* MODAL DE ITENS */}
            {selectedCupom && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
                    <div className="bg-white w-full max-w-2xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-green-400 font-black uppercase tracking-widest">Itens da Nota</p>
                                <h2 className="text-xl font-black uppercase">{selectedCupom.estabelecimentoId?.nomeCurto || selectedCupom.estabelecimentoId?.nome}</h2>
                            </div>
                            <button onClick={() => setSelectedCupom(null)} className="p-2 hover:bg-white/10 rounded-xl">
                                <X size={28} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1">
                            {loadingItens ? (
                                <div className="flex justify-center py-20"><Loader2 className="animate-spin text-green-600" /></div>
                            ) : (
                                <div className="space-y-4">
                                    {itens.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center border-b border-gray-100 pb-4 last:border-0 p-2 rounded-xl">
                                            <div className="flex-1 pr-4">
                                                <p className="text-sm font-black text-gray-900 uppercase leading-tight mb-1">{item.descricao}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-green-200">
                                                        UN: R$ {item.valorUnitario.toFixed(2)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">
                                                        {item.quantidade} {item.unidade}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-mono font-black text-gray-900 text-lg">R$ {item.valorTotal.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-8 bg-gray-50 border-t flex justify-between items-center">
                            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total da Nota</span>
                            <span className="text-3xl font-black text-gray-900 font-mono">R$ {selectedCupom.valorTotal.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}