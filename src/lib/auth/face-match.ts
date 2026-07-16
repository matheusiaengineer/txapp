export interface FaceMatchResult {
  match: boolean;
  similarity: number;
  error?: string;
}

export async function compareFaces(
  selfieBase64: string,
  docPhotoBase64: string
): Promise<FaceMatchResult> {
  try {
    const selfieImg = new Image();
    const docImg = new Image();
    selfieImg.src = selfieBase64;
    docImg.src = docPhotoBase64;
    await Promise.all([selfieImg.decode(), docImg.decode()]);

    const similarity = calculateStructuralSimilarity(selfieBase64, docPhotoBase64);

    return {
      match: similarity > 0.55,
      similarity: Math.round(similarity * 100) / 100,
    };
  } catch (err: any) {
    return {
      match: false,
      similarity: 0,
      error: err.message || "Erro ao comparar faces",
    };
  }
}

function calculateStructuralSimilarity(img1: string, img2: string): number {
  const hash1 = simplePerceptualHash(img1);
  const hash2 = simplePerceptualHash(img2);
  return hammingSimilarity(hash1, hash2);
}

function simplePerceptualHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const binary = Math.abs(hash).toString(2).padStart(32, "0");
  return binary;
}

function hammingSimilarity(hash1: string, hash2: string): number {
  let diff = 0;
  const len = Math.min(hash1.length, hash2.length);
  for (let i = 0; i < len; i++) {
    if (hash1[i] !== hash2[i]) diff++;
  }
  return 1 - diff / len;
}

export function getMatchLabel(similarity: number): string {
  if (similarity >= 0.95) return "Aprovado automaticamente";
  if (similarity >= 0.80) return "Aprovado com verificação";
  if (similarity >= 0.55) return "Revisão manual necessária";
  return "Rejeitado - não corresponde";
}

export function getMatchColor(similarity: number): string {
  if (similarity >= 0.95) return "text-primary";
  if (similarity >= 0.80) return "text-yellow-400";
  if (similarity >= 0.55) return "text-orange-400";
  return "text-red-400";
}
