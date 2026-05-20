
# 🏃‍♂️ CORRE JUNTO - Performance Atlética

Laboratório de performance para atletas operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 Como resolver o erro de Login ("The requested action is invalid")

Se você vir o erro "The requested action is invalid" ou "Falha na Autenticação", siga estes passos obrigatórios no seu Console do Firebase:

### 1. Ativar o serviço de Autenticação
1. Acesse o [Firebase Console](https://console.firebase.google.com/project/studio-1669701209-88700/authentication).
2. Se aparecer um botão **"Get Started"** (ou "Começar"), você **PRECISA** clicar nele.
3. Vá na aba **"Sign-in method"**, clique em **"Add new provider"**, escolha **Google** e ative-o (use seu e-mail de suporte se solicitado).

### 2. Autorizar o Domínio do Laboratório (Passo Crítico)
1. No seu navegador, copie o endereço onde o app está rodando (ex: `https://9002-....cloudworkstations.dev`).
2. No Firebase Console, vá em **Authentication > Settings > Authorized Domains**.
3. Clique em **"Add Domain"** e cole o endereço (remova o `https://` e tudo que vem depois do `.dev`). 
   - Exemplo: `9002-workstation-xxx.cluster-xxx.cloudworkstations.dev`

## 📱 Funcionalidades
- **Assessoria na Nuvem:** Sincronização automática entre PC e Celular via Firestore.
- **Herança de IA:** Atleta usa própria chave API ou a do treinador como fallback automático.
- **Modelo Coach:** Treinador gerencia múltiplos atletas via e-mail.
- **Análise Biomecânica:** Gemini interpreta métricas de arquivos .FIT e imagens do relógio.

## 🎨 Branding
- **CORRE:** Branco
- **JUNTO:** Verde (Primary)
