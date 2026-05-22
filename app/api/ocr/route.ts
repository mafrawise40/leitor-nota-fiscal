// app/api/ocr/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";

// Inicializa o SDK com a chave de API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export async function POST(req: Request) {
    try {

        const formData = await req.formData();
        // PEGA TODOS OS ARQUIVOS (Mudar de get para getAll)
        const files = formData.getAll("file") as File[];


        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: "Nenhum arquivo enviado" },
                { status: 400 }
            );
        }

        // Converte todos os arquivos para a estrutura da IA
        const mediaParts = await Promise.all(
            files.map(async (file) => {
                const bytes = await file.arrayBuffer();
                const base64Image = Buffer.from(bytes).toString("base64");
                return {
                    inlineData: {
                        data: base64Image,
                        mimeType: file.type,
                    },
                };
            })
        );

      

        // Chama o modelo Gemini 2.5 Flash forçando o retorno estruturado em JSON
        let aiContentParam = {
            model: "gemini-2.5-flash",
            contents: [
                {
                    parts: [
                        ...mediaParts, // Injeta todas as imagens aqui
                        { text: "Analise os dados de todos os cupons fiscais / NFC-e e extraia as informações de cada um de forma precisa separadamente." }
                    ]
                }
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
                                    categoria: { type: Type.STRING, description: "Categoria do produto, ex: Alimentos, Limpeza, Eletrônicos (se possível)" }
                                },
                                required: ["descricao", "quantidade", "valorUnitario", "valorTotal"],
                            },
                        },
                    },
                    required: ["emitenteNome", "emitenteCnpj", "chaveAcesso", "dataEmissao", "valorTotal", "itens"],
                },
            },
        };


        let response = {} as any;


        // --- LÓGICA DE RETRY (TENTATIVAS) ---
        const maxRetries = 3;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const result = await ai.models.generateContent(aiContentParam);

                response = result;
                break; // Se deu certo, sai do loop
            } catch (error: any) {
                const isServiceUnavailable = error.message?.includes("503") || error.status === 503;

                if (isServiceUnavailable && i < maxRetries - 1) {
                    const waitTime = 2000 * (i + 1); // Espera 2s, depois 4s...
                    console.warn(`Gemini 503 (Ocupado). Tentativa ${i + 1} de ${maxRetries}. Aguardando ${waitTime}ms...`);
                    await delay(waitTime);
                    continue;
                }
                throw error; // Se for outro erro ou estourar tentativas, joga pro catch principal
            }
        }


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