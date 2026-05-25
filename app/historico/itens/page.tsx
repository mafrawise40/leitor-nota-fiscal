'use client';
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Store, Sparkles, Search, X, List, ChevronUp, ChevronDown } from 'lucide-react';
import Link from 'next/link';

type SortConfig = { key: string; direction: 'asc' | 'desc' | null };

export default function ListaItensTabelaPage() {
    const [itensOriginais, setItensOriginais] = useState<any[]>([]);
    const [itensExibicao, setItensExibicao] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [agrupado, setAgrupado] = useState(false);
    const [filtroTexto, setFiltroTexto] = useState('');
    const [itemSelecionado, setItemSelecionado] = useState<any>(null);
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'updatedAt', direction: 'desc' });

    const carregar = () => {
        setLoading(true);
        fetch('/api/itens').then(res => res.json()).then(data => {
            if (data.success) {
                setItensOriginais(data.data);
                setItensExibicao(data.data);
                setAgrupado(false);
            }
            setLoading(false);
        });
    };

    useEffect(() => { carregar(); }, []);

    const agruparItensInteligente = () => {
        const resultado: any[] = [];
        const processados = new Set();

        itensOriginais.forEach((item, i) => {
            if (processados.has(i)) return;
            const termosBase = item.descricao.toUpperCase().split(/\s+/).filter((t: string) => t.length > 2);
            const grupo = [item];
            processados.add(i);

            for (let j = i + 1; j < itensOriginais.length; j++) {
                if (processados.has(j)) continue;
                const termosComparar = itensOriginais[j].descricao.toUpperCase().split(/\s+/).filter((t: string) => t.length > 2);
                const batidas = termosBase.filter((t: any) => termosComparar.includes(t)).length;
                const percentualBate = (batidas / Math.max(termosBase.length, termosComparar.length)) * 100;
                if (percentualBate >= 50) {
                    grupo.push(itensOriginais[j]);
                    processados.add(j);
                }
            }

            const grupoOrdenado = grupo.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            const maisRecente = grupoOrdenado[0];
            const maisAntigo = grupoOrdenado[grupoOrdenado.length - 1];
            const variacao = ((maisRecente.valorUnitario - maisAntigo.valorUnitario) / (maisAntigo.valorUnitario || 1)) * 100;

            resultado.push({ 
                ...maisRecente, 
                variacao, 
                itensDoGrupo: grupoOrdenado,
                totalNoGrupo: grupo.length 
            });
        });

        setItensExibicao(resultado);
        setAgrupado(true);
        setSortConfig({ key: 'variacao', direction: 'desc' }); // Ao agrupar, ordena por maior inflação por padrão
    };

    // Função de Ordenação
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        setSortConfig({ key, direction });
    };

    const itensProcessados = useMemo(() => {
        // 1. Filtragem
        let filtrados = itensExibicao.filter(item => 
            item.descricao.toLowerCase().includes(filtroTexto.toLowerCase())
        );

        // 2. Ordenação
        if (sortConfig.key) {
            filtrados.sort((a, b) => {
                let valA = a[sortConfig.key];
                let valB = b[sortConfig.key];

                // Tratamento especial para datas
                if (sortConfig.key === 'updatedAt') {
                    valA = new Date(valA).getTime();
                    valB = new Date(valB).getTime();
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return filtrados;
    }, [itensExibicao, filtroTexto, sortConfig]);

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig.key !== column) return <ChevronDown size={12} className="text-gray-300" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={12} className="text-red-600" /> : <ChevronDown size={12} className="text-red-600" />;
    };

    return (
        <main className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                
                {/* Header e Ações */}
                <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        <Link href="/historico" className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-all">
                            <ArrowLeft size={20}/>
                        </Link>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tighter">Monitor de Preços</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Total Exibido: {itensProcessados.length}</p>
                        </div>
                    </div>

                    <div className="flex flex-1 max-w-md items-center bg-white rounded-2xl px-4 border border-gray-200 shadow-sm">
                        <Search size={18} className="text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Filtrar por nome..." 
                            className="w-full p-3 outline-none text-sm font-bold bg-transparent"
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={agrupado ? carregar : agruparItensInteligente}
                        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs transition-all shadow-lg ${
                            agrupado ? 'bg-gray-800 text-white' : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                    >
                        {agrupado ? <List size={16}/> : <Sparkles size={16}/>}
                        {agrupado ? "VER LISTA BRUTA" : "CALCULAR INFLAÇÃO"}
                    </button>
                </div>

                {/* Tabela */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                    {loading ? (
                        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40} /></div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400">
                                    <tr>
                                        <th className="p-6 cursor-pointer hover:text-gray-900 transition-colors" onClick={() => handleSort('descricao')}>
                                            <div className="flex items-center gap-1">Produto <SortIcon column="descricao" /></div>
                                        </th>
                                        <th className="p-6 text-right cursor-pointer hover:text-gray-900" onClick={() => handleSort('valorUnitario')}>
                                            <div className="flex items-center justify-end gap-1">Preço Atual <SortIcon column="valorUnitario" /></div>
                                        </th>
                                        <th className="p-6 text-center cursor-pointer hover:text-gray-900" onClick={() => handleSort('variacao')}>
                                            <div className="flex items-center justify-center gap-1">Inflação <SortIcon column="variacao" /></div>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {itensProcessados.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50/50 transition-all cursor-pointer group" onClick={() => agrupado && setItemSelecionado(item)}>
                                            <td className="p-6">
                                                <div className="font-black uppercase text-gray-800 group-hover:text-red-600 transition-colors">{item.descricao}</div>
                                                <div className="text-blue-500 font-bold flex items-center gap-1 mt-1 uppercase text-[9px]">
                                                    <Store size={10}/> {item.estabelecimentoId?.nomeCurto || item.estabelecimentoId?.nome || "Mercado Desconhecido"}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className="text-sm font-black font-mono">R$ {item.valorUnitario.toFixed(2)}</span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center justify-center gap-3">
                                                    {agrupado ? (
                                                        <>
                                                            <div className={`flex items-center gap-1 font-black text-xs ${item.variacao > 0 ? 'text-red-600' : item.variacao < 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {item.variacao > 0 ? <TrendingUp size={14}/> : item.variacao < 0 ? <TrendingDown size={14}/> : null}
                                                                {item.variacao.toFixed(1)}%
                                                            </div>
                                                            <div className="bg-gray-100 text-[9px] font-black px-2 py-1 rounded-lg uppercase text-gray-500">
                                                                {item.totalNoGrupo} registros
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-300 font-bold text-[9px] uppercase tracking-tighter">Sem agrupamento</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODAL DE HISTÓRICO - MANTIDO IGUAL */}
                {itemSelecionado && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl">
                            <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
                                <h2 className="font-black text-sm uppercase text-gray-900 tracking-tighter">Histórico de Variação</h2>
                                <button onClick={() => setItemSelecionado(null)} className="p-2 hover:bg-gray-200 rounded-full transition-all text-gray-400 hover:text-black">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-6 max-h-[60vh] overflow-y-auto bg-white">
                                <p className="text-[11px] font-black text-red-600 mb-6 uppercase leading-none border-l-4 border-red-600 pl-3">{itemSelecionado.descricao}</p>
                                <div className="space-y-3">
                                    {itemSelecionado.itensDoGrupo?.map((hist: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 hover:border-gray-300 transition-all shadow-sm">
                                            <div>
                                                <p className="text-[12px] font-black uppercase">
                                                    {hist.descricao} <span className="text-[10px] font-black text-gray-400 uppercase italic"> {new Date(hist.updatedAt).toLocaleDateString('pt-BR')}</span>
                                                </p>
                                                <p className="text-[9px] font-bold text-blue-600 uppercase flex items-center gap-1 mt-1">
                                                    <Store size={10} /> {hist.estabelecimentoId?.nomeCurto || hist.estabelecimentoId?.nome || "Mercado"}
                                                </p>
                                            </div>
                                            <p className="font-mono font-black text-gray-900 text-sm">R$ {hist.valorUnitario.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}