
# 🏃‍♂️ CORRE JUNTO - Performance Atlética

Laboratório de performance operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 Como resolver o erro de Bloqueio (Erro 403 no Print)

Se a API já está **Ativada** e o erro persiste (como mostram os erros 403 no seu gráfico), siga estes 2 passos na sua tela do Google Cloud:

### 1. Remover Restrições da Chave de API
1. Na tela que você enviou, clique na aba **"Credenciais"** (ao lado de "Cotas e limites").
2. Clique na chave de API chamada **"Browser key (auto created by Firebase)"** ou similar.
3. Em **"Restrições de API"**, mude para **"Não restringir chave"** (Don't restrict key) ou adicione a **Identity Toolkit API** na lista de permitidas.
4. Clique em **SALVAR**.

### 2. Autorizar o Domínio no Firebase (Obrigatório)
1. Acesse o [Firebase Console](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Vá em **Authentication > Settings > Authorized Domains**.
3. Clique em **"Add Domain"**.
4. Cole o link do seu laboratório (o link que você vê no navegador, que termina em `.cloudworkstations.dev`).

## 📱 Sincronização em Tempo Real
- O app usa Firestore `onSnapshot`. Mudou no PC, mudou no Celular.
- **Dica:** No celular, use a opção "Adicionar à tela de início" para usar como um app nativo.
