'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Trash2, Trophy, TrendingDown, Calendar, Folder } from 'lucide-react';

export default function ComparadorPage() {
    const [termoBusca, setTermoBusca] = useState('');
    // Agora guardamos o objeto completo do banco
    const [meusFiltros, setMeusFiltros] = useState<any[]>([]);
    const [resultados, setResultados] = useState<{ [key: string]: any[] }>({});
    const [ranking, setRanking] = useState<{ [key: string]: number }>({});
    const [loading, setLoading] = useState(true);


    const [categoriasExistentes, setCategoriasExistentes] = useState<string[]>([]);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('GERAL');
    const [novaCategoria, setNovaCategoria] = useState('');
    const [mostrarInputNovaCat, setMostrarInputNovaCat] = useState(false);
    const [categoriaTexto, setCategoriaTexto] = useState(''); // Estado para o input de texto da categoria

    const buscarPrecos = async (termo: string) => {
        const res = await fetch(`/api/comparador?termo=${termo}`);
        const data = await res.json();
        if (data.success) {
            setResultados(prev => ({ ...prev, [termo]: data.data }));
        }
    };

    useEffect(() => {
        const inicializar = async () => {
            const res = await fetch('/api/filtros');
            const data = await res.json();
            if (data.success) {
                setMeusFiltros(data.data);

                // 1. Extraímos os nomes como strings puras primeiro
                const categoriasBrutas: string[] = data.data.map((f: any) => String(f.categoria || "GERAL"));

                // 2. Criamos o Set e filtramos com tipagem garantida
                const cats = Array.from(new Set(categoriasBrutas))
                    .map((c: string) => c.trim())
                    .filter((c: string) => c !== "")
                    .sort();

                setCategoriasExistentes(cats as string[]);
                if (cats.length > 0) setCategoriaSelecionada(cats[0] as string);

                data.data.forEach((f: any) => buscarPrecos(f.termo));
            }
            setLoading(false);
        };
        inicializar();
    }, []);

    // 2. Lógica de Adicionar com Categoria 
    const adicionarFiltro = async () => {
        const termo = termoBusca.toUpperCase().trim();
        const categoriaFinal = categoriaTexto.toUpperCase().trim(); // Usa o texto do input

        if (!termo || !categoriaFinal) {
            alert("Pô cara, preencha o produto E a categoria!");
            return;
        }

        try {
            const res = await fetch('/api/filtros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ termo, categoria: categoriaFinal })
            });
            const data = await res.json();

            if (data.success) {
                setMeusFiltros(prev => [...prev, data.data]);

                // Atualiza a lista de sugestões se for nova
                if (!categoriasExistentes.includes(categoriaFinal)) {
                    setCategoriasExistentes(prev => [...prev, categoriaFinal].sort());
                }

                buscarPrecos(termo);
                setTermoBusca('');
                setCategoriaTexto(''); // Limpa categoria após add (ou mantém se preferir)
            }
        } catch (err) {
            console.error("Erro ao salvar:", err);
        }
    };

    const removerCategoriaInteira = async (catNome: string) => {
        if (!catNome) return;
        if (!confirm(`Apagar todos os produtos de: ${catNome}?`)) return;

        try {
            const response = await fetch('/api/filtros', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }, // ISSO AQUI É OBRIGATÓRIO
                body: JSON.stringify({ categoria: catNome })
            });

            const data = await response.json();

            if (data.success) {
                // Limpa o estado local pra sumir da tela na hora
                setMeusFiltros(prev => prev.filter(f => f.categoria !== catNome));
                setCategoriasExistentes(prev => prev.filter(c => c !== catNome));
                console.log("Categoria removida com sucesso!");
            }
        } catch (error) {
            console.error("Erro ao chamar API de delete:", error);
        }
    };

    const removerFiltro = async (id: string, termo: string) => {
        await fetch('/api/filtros', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }) // Manda o ID específico
        });

        // Filtra pelo ID no estado local
        setMeusFiltros(prev => prev.filter(f => f._id !== id));

        // Só remove o resultado da tela se não houver mais nenhum outro "FRANGO" de outra categoria
        const aindaTemEsseTermo = meusFiltros.some(f => f.termo === termo && f._id !== id);
        if (!aindaTemEsseTermo) {
            setResultados(prev => {
                const copy = { ...prev };
                delete copy[termo];
                return copy;
            });
        }
    };

    // 3. Agrupamento para o Layout
    const filtrosAgrupados = meusFiltros.reduce((acc: any, filtro: any) => {
        const cat = filtro.categoria || "GERAL";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(filtro);
        return acc;
    }, {});

    // Ranking (mesma lógica)
    useEffect(() => {
        const novoRanking: { [key: string]: number } = {};
        Object.values(resultados).forEach(itens => {
            if (itens?.[0]) {
                const n1 = itens[0].estabelecimentoId?.nomeCurto || itens[0].estabelecimentoId?.nome;
                novoRanking[n1] = (novoRanking[n1] || 0) + 2;
            }
            if (itens?.[1]) {
                const n2 = itens[1].estabelecimentoId?.nomeCurto || itens[1].estabelecimentoId?.nome;
                novoRanking[n2] = (novoRanking[n2] || 0) + 1;
            }
        });
        setRanking(novoRanking);
    }, [resultados]);

    return (
        <main className="min-h-screen bg-[#F8F9FA] pb-32 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
                        Monitor de <span className="text-green-600">Economia</span>
                    </h1>

                    <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                        {/* INPUT DE CATEGORIA COM AUTOCOMPLETE */}
                        <div className="relative flex-1 md:w-48">
                            <input
                                list="categorias-list"
                                type="text"
                                placeholder="CATEGORIA (EX: MERCADO)"
                                className="bg-white border rounded-full px-4 py-2 text-[10px] font-bold outline-none shadow-sm h-10 w-full border-green-200 focus:border-green-500"
                                value={categoriaTexto}
                                onChange={(e) => setCategoriaTexto(e.target.value.toUpperCase())}
                            />
                            <datalist id="categorias-list">
                                {categoriasExistentes.map(c => (
                                    <option key={c} value={c} />
                                ))}
                            </datalist>
                        </div>

                        {/* INPUT DO PRODUTO */}
                        <div className="bg-white border rounded-full px-4 py-2 flex items-center shadow-sm flex-1 md:w-64 h-10">
                            <Search size={16} className="text-gray-400 mr-2" />
                            <input
                                type="text"
                                placeholder="NOME DO PRODUTO (EX: ARROZ)"
                                className="bg-transparent text-xs font-bold outline-none w-full uppercase"
                                value={termoBusca}
                                onChange={(e) => setTermoBusca(e.target.value.toUpperCase())}
                                onKeyDown={(e) => e.key === 'Enter' && adicionarFiltro()}
                            />
                        </div>

                        <button
                            onClick={adicionarFiltro}
                            className="bg-black text-white p-2 rounded-full hover:bg-green-600 h-10 w-10 flex items-center justify-center shrink-0 transition-colors"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                </div>

                {/* Ranking */}
                {Object.keys(ranking).length > 0 && (
                    <div className="bg-white rounded-3xl border p-6 mb-8 shadow-sm">
                        <div className="flex items-center gap-2 mb-4 text-gray-400">
                            <Trophy size={18} className="text-yellow-500" />
                            <h2 className="text-xs font-black uppercase">Melhores Opções</h2>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(ranking).sort(([, a], [, b]) => b - a).map(([nome, pontos], idx) => (
                                <div key={nome} className="bg-gray-50 border px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold">
                                    <span className="text-gray-300">#{idx + 1}</span>
                                    <span className="uppercase">{nome}</span>
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-md text-[10px]">{pontos} PTS</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Grid Categorizado */}
                {Object.keys(filtrosAgrupados).map(catNome => (
                    <div key={catNome} className="mb-12">
                        <div className="flex items-center justify-between mb-4 border-b-2 border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                                <Folder size={18} className="text-green-600" />
                                <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter">
                                    {catNome}
                                </h2>
                                <span className="text-[9px] bg-gray-200 px-2 py-0.5 rounded-full text-gray-500">
                                    {filtrosAgrupados[catNome].length} PRODUTOS
                                </span>
                            </div>

                            <button
                                onClick={() => removerCategoriaInteira(catNome)}
                                className="flex items-center gap-1 text-[9px] font-bold text-gray-400 hover:text-red-500 transition-all uppercase"
                            >
                                <Trash2 size={14} /> Excluir Grupo
                            </button>
                        </div>


                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filtrosAgrupados[catNome].map((f: any) => (
                                <section key={f._id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
                                    <div className="px-5 py-3 bg-gray-50/50 border-b flex justify-between items-center">
                                        <div className="flex items-center gap-2 font-black text-[11px] text-gray-800 uppercase">
                                            <TrendingDown size={14} className="text-green-600" /> {f.termo}
                                        </div>
                                        <button onClick={() => removerFiltro(f._id, f.termo)} className="text-gray-300 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div className="flex-1">
                                        {resultados[f.termo]?.map((item: any, index: number) => {
                                            const ehPrimeiro = index === 0;
                                            return (
                                                <div
                                                    key={item._id}
                                                    className={`p-3 border-b last:border-0 transition-all ${ehPrimeiro ? 'bg-green-50/50' : 'hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <p className={`text-[10px] font-black uppercase ${ehPrimeiro ? 'text-green-700' : 'text-blue-600'
                                                                }`}>
                                                                {item.estabelecimentoId?.nome || "Mercado Desconhecido"}
                                                                {ehPrimeiro && " 🏆 MELHOR PREÇO"}
                                                            </p>
                                                            <p className={`text-[11px] leading-tight font-medium ${ehPrimeiro ? 'text-gray-900' : 'text-gray-500'
                                                                }`}>
                                                                {item.descricao}
                                                            </p>
                                                        </div>

                                                        {/* DESTAQUE DO PREÇO */}
                                                        <div className="text-right">
                                                            <p className={`text-sm font-black ${ehPrimeiro ? 'text-green-600' : 'text-gray-900'
                                                                }`}>
                                                                R$ {item.valorUnitario.toFixed(2)}
                                                            </p>

                                                            {/* DESTAQUE DA DATA */}
                                                            <p className={`text-[9px] font-bold px-1 rounded inline-block ${ehPrimeiro
                                                                    ? 'bg-green-200 text-green-800'
                                                                    : 'bg-gray-100 text-gray-500'
                                                                }`}>
                                                                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </main>
    );
}