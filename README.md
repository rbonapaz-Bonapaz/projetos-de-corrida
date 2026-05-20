
# 🏃‍♂️ CORRE JUNTO - Performance Atlética

Laboratório de performance para atletas operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 Como resolver o erro de Login / API Blocked

Se você vir o erro "requests-to-this-api-identitytoolkit...-are-blocked" ou "The requested action is invalid", siga estes passos obrigatórios:

### 1. Ativar a API de Identidade (Passo Crítico para este Erro)
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/apis/library/identitytoolkit.googleapis.com).
2. Verifique se o projeto selecionado é o `studio-1669701209-88700`.
3. Clique no botão **ATIVAR** (ou "Enable"). Sem isso, o Firebase não consegue validar seu login.

### 2. Ativar o serviço de Autenticação no Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/project/studio-1669701209-88700/authentication).
2. Se aparecer um botão **"Get Started"**, clique nele.
3. Vá na aba **"Sign-in method"**, ative o **Google** e o **E-mail/Password**.

### 3. Autorizar o Domínio do Laboratório
1. No Firebase Console, vá em **Authentication > Settings > Authorized Domains**.
2. Clique em **"Add Domain"** e cole o endereço do seu laboratório (ex: `9002-workstation...cloudworkstations.dev`).

## 📱 Funcionalidades Cloud-First
- **Sincronização Real-Time:** PC e Celular sempre em paridade via Firestore `onSnapshot`.
- **Login Híbrido:** Suporte a Google e E-mail/Senha para máxima resiliência.
- **Motor Gemini:** Análise biomecânica de alta performance.

## 🎨 Branding
- **CORRE:** Branco (#FFFFFF)
- **JUNTO:** Verde Neon (#4ADE80)
