'use client';

import { useState, useEffect } from 'react';
import { Store, Trash2, Edit3, Check, X, MapPin, Search } from 'lucide-react';

export default function EstabelecimentosPage() {
    const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
    const [busca, setBusca] = useState('');
    const [editando, setEditando] = useState<string | null>(null);
    const [tempNomeCurto, setTempNomeCurto] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            const res = await fetch('/api/estabelecimentos');
            const data = await res.json();
            if (data.success) setEstabelecimentos(data.data);
        } catch (err) {
            console.error("Erro ao carregar:", err);
        } finally {
            setLoading(false);
        }
    };

    const salvarNomeCurto = async (id: string) => {
        const res = await fetch(`/api/estabelecimentos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomeCurto: tempNomeCurto.toUpperCase() })
        });
        
        if (res.ok) {
            setEditando(null);
            carregarDados();
        }
    };

    const excluir = async (id: string) => {
        if (confirm("Atenção: Excluir o estabelecimento não apagará os itens, mas eles podem ficar sem referência. Deseja continuar?")) {
            const res = await fetch(`/api/estabelecimentos/${id}`, { method: 'DELETE' });
            if (res.ok) carregarDados();
        }
    };

    // Filtro simples na tela
    const listaFiltrada = estabelecimentos.filter(e => 
        e.nome.toLowerCase().includes(busca.toLowerCase()) || 
        (e.nomeCurto && e.nomeCurto.toLowerCase().includes(busca.toLowerCase()))
    );

    return (
        <main className="min-h-screen bg-[#F8F9FA] pb-32 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
                        Meus <span className="text-green-600">Estabelecimentos</span>
                    </h1>

                    {/* Busca Rápida */}
                    <div className="bg-white border rounded-full px-4 py-2 flex items-center shadow-sm w-full md:w-64">
                        <Search size={16} className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="FILTRAR..."
                            className="bg-transparent text-[10px] font-black outline-none w-full uppercase"
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-3">
                    {loading ? (
                        <div className="text-center py-10 font-black text-gray-300 uppercase animate-pulse">Carregando...</div>
                    ) : listaFiltrada.map((est) => (
                        <div key={est._id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-green-200">
                            
                            <div className="flex items-center gap-4 flex-1">
                                <div className="bg-gray-50 p-3 rounded-xl text-gray-400 shrink-0">
                                    <Store size={20} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black text-gray-800 uppercase truncate">
                                            {est.nomeCurto || est.nome}
                                        </h3>
                                        {est.nomeCurto && (
                                            <span className="text-[8px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-bold italic">ORIGINAL: {est.nome}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400 mt-1">
                                        <MapPin size={10} />
                                        <span className="text-[9px] font-bold uppercase truncate max-w-[300px]">
                                            {est.endereco || "Endereço não registrado"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Área de Ações e Nome Curto */}
                            <div className="flex items-center gap-2 self-end md:self-center">
                                {editando === est._id ? (
                                    <div className="flex items-center gap-1 bg-green-50 p-1 rounded-lg border border-green-100">
                                        <input 
                                            className="bg-white border-none rounded px-2 py-1 text-[10px] font-black uppercase outline-none w-32 shadow-inner"
                                            value={tempNomeCurto}
                                            onChange={(e) => setTempNomeCurto(e.target.value)}
                                            placeholder="APELIDO"
                                            autoFocus
                                        />
                                        <button onClick={() => salvarNomeCurto(est._id)} className="p-1 text-green-600 hover:bg-white rounded transition-all">
                                            <Check size={16} />
                                        </button>
                                        <button onClick={() => setEditando(null)} className="p-1 text-red-400 hover:bg-white rounded">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => {
                                                setEditando(est._id);
                                                setTempNomeCurto(est.nomeCurto || '');
                                            }}
                                            className="flex items-center gap-1 px-3 py-2 bg-gray-50 hover:bg-black hover:text-white rounded-xl text-[10px] font-black uppercase transition-all text-gray-500"
                                        >
                                            <Edit3 size={14} /> {est.nomeCurto ? 'Alterar' : 'Apelidar'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => excluir(est._id)}
                                            className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {!loading && listaFiltrada.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed rounded-3xl text-gray-300 font-black uppercase text-xs">
                            Nenhum estabelecimento encontrado
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}