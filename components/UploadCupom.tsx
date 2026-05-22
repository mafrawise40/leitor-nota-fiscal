"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Camera, Save, ShoppingBag, Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";

export default function UploadCupom() {
    const [previews, setPreviews] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    
    // Agora focamos em um único objeto de cupom
    const [cupomUnico, setCupomUnico] = useState<any>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setLoading(true);
        
        for (const file of acceptedFiles) {
            const imageUrl = URL.createObjectURL(file);
            setPreviews((prev) => [...prev, imageUrl]);

            try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/ocr", { method: "POST", body: formData });
                const resData = await response.json();

                if (resData.success) {
                    const novosDados = resData.data;

                    setCupomUnico((prev: any) => {
                        if (!prev) return novosDados; // Primeira foto define o cabeçalho (CNPJ, Nome, etc)

                        // Filtra para não adicionar itens repetidos (caso as fotos se sobreponham)
                        const itensFiltrados = novosDados.itens.filter((novoItem: any) => 
                            !prev.itens.find((itemExistente: any) => 
                                itemExistente.descricao === novoItem.descricao && 
                                itemExistente.valorTotal === novoItem.valorTotal
                            )
                        );

                        const listaAtualizada = [...prev.itens, ...itensFiltrados];
                        
                        return {
                            ...prev,
                            itens: listaAtualizada,
                            valorTotal: listaAtualizada.reduce((acc: number, i: any) => acc + i.valorTotal, 0)
                        };
                    });
                }
            } catch (err) {
                console.error("Erro no OCR:", err);
            }
        }
        setLoading(false);
    }, []);

    const salvarNoBanco = async () => {
        if (!cupomUnico) return;
        setSaving(true);
        try {
            const response = await fetch("/api/salvar-cupom", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(cupomUnico),
            });
            if (response.ok) {
                alert("Cupom completo salvo com sucesso!");
                resetar();
            }
        } catch (err) {
            alert("Erro ao salvar no banco.");
        } finally {
            setSaving(false);
        }
    };

    const resetar = () => {
        setCupomUnico(null);
        setPreviews([]);
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] } });

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
            
            {/* Esquerda: Upload e Fotos Acumuladas */}
            <div className="lg:col-span-4 space-y-4">
                <div 
                    {...getRootProps()} 
                    className={`border-4 border-dashed rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[250px] cursor-pointer transition-all
                        ${isDragActive ? "border-green-500 bg-green-50" : "border-gray-200 bg-white hover:border-black"}`}
                >
                    <input {...getInputProps()} />
                    <div className="bg-gray-100 p-4 rounded-2xl mb-4 group-hover:bg-black transition-colors">
                        <Camera size={32} />
                    </div>
                    <p className="font-black text-center text-gray-800">
                        {previews.length > 0 ? "Adicionar próxima parte da nota" : "Tirar foto da nota"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Clique ou arraste</p>
                </div>

                {/* Grid de miniaturas das partes da nota */}
                <div className="grid grid-cols-3 gap-2">
                    {previews.map((src, i) => (
                        <div key={i} className="aspect-square rounded-xl overflow-hidden border shadow-sm">
                            <img src={src} className="w-full h-full object-cover" alt={`Parte ${i+1}`} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Direita: Resultado Acumulado */}
            <div className="lg:col-span-8">
                {!cupomUnico && !loading && (
                    <div className="h-full flex flex-col items-center justify-center py-20 text-gray-300 border-2 border-dashed rounded-[2.5rem] bg-white/50">
                        <ShoppingBag size={64} strokeWidth={1} />
                        <p className="mt-4 font-bold">Nenhum item processado</p>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center gap-3 p-4 bg-black text-white rounded-2xl mb-4 animate-pulse">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="font-bold">Lendo imagem e extraindo itens...</span>
                    </div>
                )}

                {cupomUnico && (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
                        {/* Header do Cupom */}
                        <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">
                                    {cupomUnico.emitenteNome}
                                </h2>
                                <p className="text-[10px] text-gray-400 font-mono tracking-widest">CNPJ: {cupomUnico.emitenteCnpj}</p>
                            </div>
                            <button onClick={resetar} className="p-3 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>

                        {/* Lista de Itens Acumulados */}
                        <div className="p-8">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="font-bold text-gray-400 uppercase text-xs tracking-widest">Itens Identificados ({cupomUnico.itens.length})</h3>
                                <div className="h-[1px] flex-1 bg-gray-100 mx-4"></div>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-8">
                                {cupomUnico.itens.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center group animate-in fade-in slide-in-from-right-2">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-800 uppercase line-clamp-1">{item.descricao}</span>
                                            <span className="text-[10px] text-gray-400 font-bold">{item.quantidade} {item.unidade} x R${item.valorUnitario.toFixed(2)}</span>
                                        </div>
                                        <span className="font-mono font-black text-gray-900">R${item.valorTotal.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Rodapé com Total e Botão Salvar */}
                            <div className="pt-8 border-t-2 border-gray-50 flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Valor Total Acumulado</span>
                                    <div className="text-5xl font-black text-gray-900 font-mono tracking-tighter">
                                        <small className="text-lg mr-1 font-normal italic">R$</small>
                                        {cupomUnico.valorTotal.toFixed(2)}
                                    </div>
                                </div>
                                
                                <button
                                    onClick={salvarNoBanco}
                                    disabled={saving || loading}
                                    className="w-full md:w-auto px-10 h-20 bg-green-600 hover:bg-green-700 text-white rounded-[1.5rem] flex items-center justify-center gap-3 shadow-xl shadow-green-100 transition-all active:scale-95 disabled:bg-gray-200 disabled:shadow-none"
                                >
                                    {saving ? <Loader2 className="animate-spin" /> : <Save size={28} />}
                                    <span className="font-black text-xl">SALVAR CUPOM</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}