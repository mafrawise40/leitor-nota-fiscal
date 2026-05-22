// models/ItemCupom.ts
import mongoose, { Schema, model, models } from "mongoose";

const ItemCupomSchema = new Schema({
  cupomId: { type: Schema.Types.ObjectId, ref: "Cupom", required: true },
  estabelecimentoId: { type: Schema.Types.ObjectId, ref: "Estabelecimento", required: true }, // Atalho para a agregação de comparação ser ultra rápida
  codigo: { type: String }, // Código de barras ou interno (ajuda muito na comparação)
  descricao: { type: String, required: true }, // Trataremos isso para bater produtos iguais
  quantidade: { type: Number, required: true },
  unidade: { type: String, default: "UN" }, // UN ou KG
  valorUnitario: { type: Number, required: true }, // Este campo dita quem é mais barato
  valorTotal: { type: Number, required: true }
}, { timestamps: true });

export const ItemCupom = models.ItemCupom || model("ItemCupom", ItemCupomSchema);