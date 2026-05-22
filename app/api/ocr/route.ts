// app/api/ocr/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Inicializa o SDK com a chave de API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Arquivo não enviado" },
        { status: 400 }
      );
    }

    // Converte o arquivo para Buffer e depois para Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Chama o modelo Gemini 2.5 Flash forçando o retorno estruturado em JSON
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: file.type, // ex: image/jpeg, image/png
          },
        },
        "Analise os dados deste cupom fiscal / NFC-e e extraia as informações de forma precisa. ",
      ],
      config: {
        // Força a resposta a ser um JSON válido sem rodeios
        responseMimeType: "application/json",
        // Passa o esquema exato do que o backend espera mapear
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            emitenteNome: { type: Type.STRING, description: "Razão social ou Nome Fantasia do estabelecimento" },
            emitenteCnpj: { type: Type.STRING, description: "Apenas os números do CNPJ" },
            emitenteEndereco: { type: Type.STRING, description: "Endereço completo extraído" },
            emitenteTelefone: { type: Type.STRING, description: "Telefone se houver" },
            chaveAcesso: { type: Type.STRING, description: "Os 44 números da Chave de Acesso da nota" },
            numeroNota: { type: Type.STRING, description: "Número sequencial da NFCe-n" },
            serie: { type: Type.STRING, description: "Série da nota" },
            dataEmissao: { type: Type.STRING, description: "Data/Hora de emissão formatada em formato ISO8601 (YYYY-MM-DDTHH:mm:ss.sssZ)" },
            valorTotal: { type: Type.NUMBER, description: "Valor final total pago" },
            formaPagamento: { type: Type.STRING, description: "Forma de pagamento (ex: Cartão de Crédito, Dinheiro, Pix)" },
            itens: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  codigo: { type: Type.STRING, description: "Código de identificação do produto" },
                  descricao: { type: Type.STRING, description: "Nome/Descrição do produto em caixa alta, se houver palavras abreviadas tente achar o significado completo" },
                  quantidade: { type: Type.NUMBER, description: "Quantidade comprada do item" },
                  unidade: { type: Type.STRING, description: "Unidade de medida, ex: UN, KG, PC" },
                  valorUnitario: { type: Type.NUMBER, description: "Valor de um único item" },
                  valorTotal: { type: Type.NUMBER, description: "Valor total do item (quantidade * valorUnitario)" },
                },
                required: ["descricao", "quantidade", "valorUnitario", "valorTotal"],
              },
            },
          },
          required: ["emitenteNome", "emitenteCnpj", "chaveAcesso", "dataEmissao", "valorTotal", "itens"],
        },
      },
    });

    // Pega o texto gerado (que com certeza será um JSON válido por causa do responseSchema)
    const jsonText = response.text;

    if (!jsonText) {
      throw new Error("A IA retornou uma resposta vazia.");
    }

    // Transforma em objeto JS antes de responder para o Frontend
    const cupomDadosEstruturados = JSON.parse(jsonText);

    return NextResponse.json({
      success: true,
      data: cupomDadosEstruturados,
    });

  } catch (err) {
    console.error("Erro no Gemini OCR:", err);
    return NextResponse.json(
      { error: "Erro ao processar imagem e estruturar dados com IA" },
      { status: 500 }
    );
  }
}