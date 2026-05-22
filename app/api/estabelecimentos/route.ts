import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Estabelecimento } from "@/model/Estabelecimento";

// LISTAR TODOS OS ESTABELECIMENTOS
export async function GET() {
  try {
    await connectDB();

    // Busca todos e ordena por nome ou pelo nomeCurto se existir
    const estabelecimentos = await Estabelecimento.find()
      .sort({ nomeCurto: 1, nome: 1 });

    return NextResponse.json({ 
      success: true, 
      data: estabelecimentos 
    });

  } catch (err: any) {
    console.error("Erro ao listar estabelecimentos:", err);
    return NextResponse.json({ 
      success: false, 
      error: err.message 
    }, { status: 500 });
  }
}

// CRIAR UM NOVO (Opcional, caso queira adicionar manualmente)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.nome) {
      return NextResponse.json({ success: false, error: "Nome é obrigatório" }, { status: 400 });
    }

    const novo = await Estabelecimento.create({
      nome: body.nome.toUpperCase(),
      nomeCurto: body.nomeCurto?.toUpperCase(),
      endereco: body.endereco
    });

    return NextResponse.json({ success: true, data: novo });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}