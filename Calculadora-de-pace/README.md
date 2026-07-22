# 🏃‍♂️ Calculadora de Pace - Motor de Performance

Este projeto é uma suíte completa de ferramentas para corredores, incluindo calculadoras de pace, preditores de prova, mapeamento de zonas de FC e planejamento de hidratação.

## 🚀 Como subir para o seu GitHub (Se a pasta já existe)

Como você já tem a pasta `projetos-de-corrida`, siga estes comandos no seu terminal:

### 1. Entrar na pasta e preparar o terreno
```bash
# Entre na pasta que já existe
cd projetos-de-corrida

# Garanta que você está na versão mais recente do GitHub
git pull origin main

# Crie a pasta específica deste projeto (se não existir)
mkdir -p calculadora-de-pace
```

### 2. Mover os arquivos
Agora, você precisa copiar os arquivos que você editou (que estão na pasta de cima) para dentro da pasta que você acabou de criar.
```bash
# Copia as pastas e arquivos principais (do nível acima para a pasta atual)
cp -r ../src ./calculadora-de-pace/
cp -r ../public ./calculadora-de-pace/
cp ../package.json ./calculadora-de-pace/
cp ../tailwind.config.ts ./calculadora-de-pace/
cp ../tsconfig.json ./calculadora-de-pace/
cp ../next.config.ts ./calculadora-de-pace/
cp ../components.json ./calculadora-de-pace/
cp ../.gitignore ./calculadora-de-pace/
```

### 3. Enviar para o GitHub
```bash
# Adiciona as mudanças ao Git
git add calculadora-de-pace/

# Cria o registro da versão
git commit -m "feat: adiciona calculadora de pace ao portfólio"

# Envia para o servidor do GitHub
git push origin main
```

---

## 🛠️ Tecnologias Utilizadas
- **Next.js 15** (App Router)
- **Firebase** (Auth & Firestore)
- **Tailwind CSS** (Estilização Neon/Dark)
- **ShadCN UI** (Componentes de Interface)
- **Lucide React** (Ícones)
- **Recharts** (Gráficos de Performance)

---
Desenvolvido com foco em alta performance.