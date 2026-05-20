
# 🏃‍♂️ CORRE JUNTO - Performance Atlética

Laboratório de performance operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 Como resolver o erro de Login (Passo a Passo do Print)

Se você vir o erro "requests-to-this-api-identitytoolkit...-are-blocked", siga estes passos obrigatórios na sua tela do Google Cloud:

### 1. Ativar a API de Identidade
1. Na barra de pesquisa no topo da tela, digite **"Identity Toolkit"**.
2. Selecione **Identity Toolkit API**.
3. Clique no botão **ATIVAR**.

### 2. Ativar o serviço de Autenticação no Firebase
1. Acesse o [Firebase Console](https://console.firebase.google.com/project/studio-1669701209-88700/authentication).
2. Clique em **"Get Started"**.
3. Vá na aba **"Sign-in method"**, ative o **Google** e o **E-mail/Password**.

### 3. Autorizar o Domínio
1. No Firebase Console, vá em **Authentication > Settings > Authorized Domains**.
2. Clique em **"Add Domain"** e cole o link do seu laboratório (o link que termina em `.cloudworkstations.dev`).

## 📱 Sincronização em Tempo Real
- O app usa Firestore `onSnapshot`. Mudou no PC, mudou no Celular.
- **Dica:** No celular, use a opção "Adicionar à tela de início" para usar como um app nativo.
