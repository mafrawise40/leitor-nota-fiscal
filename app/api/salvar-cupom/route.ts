import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Estabelecimento } from "@/model/Estabelecimento";
import { Cupom } from "@/model/Cupom";
import { ItemCupom } from "@/model/ItemCupom";

export async function POST(req: Request) {
  try {
    await connectDB();
    const dados = await req.json();

    // 1. Upsert do Estabelecimento
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

    // 2. Upsert do Cupom
    const cupom = await Cupom.findOneAndUpdate(
      { chaveAcesso: dados.chaveAcesso },
      {
        estabelecimentoId: estab._id,
        chaveAcesso: dados.chaveAcesso,
        numeroNota: dados.numeroNota,
        serie: dados.serie,
        dataEmissao: new Date(dados.dataEmissao),
        valorTotal: dados.valorTotal,
        formaPagamento: dados.formaPagamento
      },
      { upsert: true, new: true }
    );

    // 3. Salva Itens
    await ItemCupom.deleteMany({ cupomId: cupom._id });
    const itens = dados.itens.map((item: any) => ({
      ...item,
      cupomId: cupom._id,
      estabelecimentoId: estab._id,
      descricao: item.descricao.toUpperCase()
    }));
    await ItemCupom.insertMany(itens);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}