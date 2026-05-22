import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Cupom } from "@/model/Cupom";

export async function GET() {
  try {
    await connectDB();
    // Busca cupons ordenando pelos mais recentes
    const cupons = await Cupom.find().populate("estabelecimentoId").sort({ dataEmissao: -1 });
    return NextResponse.json({ success: true, data: cupons });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}