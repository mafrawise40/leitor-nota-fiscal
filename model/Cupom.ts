// models/Cupom.ts
import mongoose, { Schema, model, models } from "mongoose";

const CupomSchema = new Schema({
  estabelecimentoId: { type: Schema.Types.ObjectId, ref: "Estabelecimento", required: true },
  chaveAcesso: { type: String, required: true, unique: true }, 
  numeroNota: { type: String },
  serie: { type: String },
  dataEmissao: { type: Date, required: true },
  valorTotal: { type: Number, required: true },
  formaPagamento: { type: String }
}, { timestamps: true });

export const Cupom = models.Cupom || model("Cupom", CupomSchema);