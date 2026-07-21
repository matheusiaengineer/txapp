import os
import requests

# ========== COLE SUA NOVA API KEY AQUI ==========
API_KEY = "sk-gLHgo7XMyDCG3YspFR0qk4bRkFLdYjV7CcRrggT0BZDwBZjN"
# ================================================

BASE_URL = "https://api.moonshot.cn/v1"

def ler_arquivos_projeto(pasta):
    arquivos = []
    extensoes = ['.py', '.js', '.html', '.css', '.json', '.md', '.txt', '.ts', '.jsx', '.tsx', '.vue', '.php']
    
    for root, dirs, files in os.walk(pasta):
        dirs[:] = [d for d in dirs if d not in ['node_modules', '.git', 'build', 'dist', '__pycache__', '.venv', 'venv']]
        
        for file in files:
            if any(file.endswith(ext) for ext in extensoes):
                caminho = os.path.join(root, file)
                try:
                    with open(caminho, 'r', encoding='utf-8') as f:
                        conteudo = f.read()
                    if len(conteudo) > 3000:
                        conteudo = conteudo[:3000] + "\n... [truncado]"
                    arquivos.append(f"=== {file} ===\n{conteudo}\n")
                except:
                    pass
    
    return "\n".join(arquivos)

def analisar_com_kimi(conteudo):
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "kimi-k2.7-code",
        "messages": [
            {
                "role": "system",
                "content": "Voce e um especialista em desenvolvimento de software. Analise o projeto e diga: 1) O que o projeto faz, 2) O que esta incompleto, 3) O que pode ser otimizado, 4) Sugestoes de melhorias. Responda em portugues do Brasil."
            },
            {
                "role": "user",
                "content": f"Aqui esta o projeto:\n\n{conteudo[:25000]}"
            }
        ],
        "temperature": 1,
        "max_tokens": 4000
    }
    
    print("Enviando para o Kimi analisar...")
    response = requests.post(f"{BASE_URL}/chat/completions", headers=headers, json=data, timeout=120)
    
    if response.status_code == 200:
        return response.json()['choices'][0]['message']['content']
    else:
        return f"Erro {response.status_code}: {response.text}"

# ========== EXECUCAO ==========
pasta = r"C:\Users\awqy\Desktop\txap"
print("=" * 60)
print("ANALISADOR DE PROJETO - KIMI API")
print("=" * 60)

print(f"\nLendo arquivos de: {pasta}")
conteudo = ler_arquivos_projeto(pasta)

if not conteudo:
    print("Nenhum arquivo de codigo encontrado!")
else:
    print(f"Lidos {len(conteudo)} caracteres. Analisando...")
    resposta = analisar_com_kimi(conteudo)
    
    print("\n" + "=" * 60)
    print("ANALISE DO KIMI:")
    print("=" * 60)
    print(resposta)
    print("=" * 60)
