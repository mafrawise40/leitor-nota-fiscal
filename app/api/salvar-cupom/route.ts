import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Estabelecimento } from "@/model/Estabelecimento";
import { Cupom } from "@/model/Cupom";
import { ItemCupom } from "@/model/ItemCupom";

export async function POST(req: Request) {
  try {
    await connectDB();
    const dados = await req.json();

    // 1. Tratamento de valores padrão para evitar quebra no Banco
    // Se não tiver chave de acesso, gera uma string baseada no timestamp para permitir o salvamento
    const chaveFinal = !dados.chaveAcesso || dados.chaveAcesso.includes("NAO_ENCONTRADA") 
      ? `MANUAL-${Date.now()}` 
      : dados.chaveAcesso;

    // Se a data for inválida, usa a data/hora atual
    const dataFinal = !dados.dataEmissao || dados.dataEmissao.includes("NAO_ENCONTRADA")
      ? new Date() 
      : new Date(dados.dataEmissao);

    // 2. Upsert do Estabelecimento
    const estab = await Estabelecimento.findOneAndUpdate(
      { cnpj: dados.emitenteCnpj },
      {
        cnpj: dados.emitenteCnpj,
        nome: dados.emitenteNome,
        endereco: dados.emitenteEndereco,
        telefone: dados.emitenteTelefone
      },
      { upsert: true, new: true }
    );

    // 3. Upsert do Cupom
    const cupom = await Cupom.findOneAndUpdate(
      { chaveAcesso: chaveFinal },
      {
        estabelecimentoId: estab._id,
        chaveAcesso: chaveFinal,
        numeroNota: dados.numeroNota || "S/N",
        serie: dados.serie || "0",
        dataEmissao: dataFinal,
        valorTotal: dados.valorTotal || 0,
        formaPagamento: dados.formaPagamento || "NÃO INFORMADO"
      },
      { upsert: true, new: true }
    );

    // 4. Salva Itens
    // Limpa itens antigos caso seja um re-processamento do mesmo cupom
    await ItemCupom.deleteMany({ cupomId: cupom._id });

    const itens = dados.itens.map((item: any) => ({
      ...item,
      cupomId: cupom._id,
      estabelecimentoId: estab._id,
      // Garante que valores numéricos não venham vazios
      quantidade: item.quantidade || 1,
      valorUnitario: item.valorUnitario || 0,
      valorTotal: item.valorTotal || 0,
      descricao: item.descricao ? item.descricao.toUpperCase() : "PRODUTO SEM DESCRIÇÃO"
    }));

    await ItemCupom.insertMany(itens);

    return NextResponse.json({ success: true, cupomId: cupom._id });
  } catch (err: any) {
    console.error("Erro ao salvar cupom:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}