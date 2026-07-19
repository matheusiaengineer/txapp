import { NextRequest, NextResponse } from "next/server";
import { withRateLimit } from "@/lib/api-middleware";

interface CNPJResponse {
  valid: boolean;
  companyData?: {
    cnpj: string;
    razao_social: string;
    nome_fantasia: string;
    situacao_cadastral: string;
    endereco: string;
    cnae: string;
    data_abertura: string;
    porte: string;
  };
  error?: string;
}

const handler = async (req: NextRequest) => {
  try {
    const { cnpj } = await req.json();
    const cleanCNPJ = cnpj.replace(/\D/g, "");

    if (!cleanCNPJ || cleanCNPJ.length !== 14) {
      return NextResponse.json({
        valid: false,
        error: "CNPJ inválido. Deve conter 14 dígitos.",
      });
    }

    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ valid: false, error: "CNPJ não encontrado na Receita Federal" });
      }
      return NextResponse.json({ valid: false, error: "Erro ao consultar CNPJ. Tente novamente." });
    }

    const data = await res.json();

    const response: CNPJResponse = {
      valid: data.situacao_cadastral === "ATIVA",
      companyData: {
        cnpj: data.cnpj,
        razao_social: data.razao_social || "",
        nome_fantasia: data.nome_fantasia || "",
        situacao_cadastral: data.situacao_cadastral || "",
        endereco: `${data.logradouro || ""}, ${data.numero || ""} - ${data.bairro || ""}, ${data.municipio || ""} - ${data.uf || ""}`,
        cnae: data.cnae_fiscal_descricao || "",
        data_abertura: data.data_inicio_atividade || "",
        porte: data.porte || "",
      },
    };

    return NextResponse.json(response);
  } catch (err: any) {
    return NextResponse.json({ valid: false, error: err.message || "Erro interno" }, { status: 500 });
  }
};

export const POST = withRateLimit(handler, 'default');
