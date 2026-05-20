# 🏃‍♂️ CORRE JUNTO - Laboratório de Performance

Sua plataforma de elite para periodização e análise biomecânica, operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 RESOLVENDO O LOGIN E DEPLOY (Deploy via GitHub)

O app está configurado e pronto para uso com a sua nova chave de API.

### 1. Desbloqueio da Chave (Obrigatório)
1. Acesse o [Google Cloud Console - Credenciais](https://console.cloud.google.com/apis/credentials).
2. Clique na chave `Assessoria Corre Junto`.
3. Em **"Restrições de API"**, selecione **"Não restringir chave"** (Don't restrict key).
4. Clique em **SALVAR**.

### 2. Autorizar o Domínio do Laboratório
1. Acesse: [Firebase Console - Domínios Autorizados](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Clique em **"Adicionar domínio"**.
3. Adicione os domínios do seu print:
   - `studio-1669701209-88700.web.app`
   - `studio-1669701209-88700.firebaseapp.com`
4. **Importante:** Isso libera o Login com Google no navegador.

### 3. Deploy Automático via GitHub
Para que o seu repositório seja publicado automaticamente:
1. No Firebase Console, vá em **App Hosting**.
2. Clique em **"Começar"**.
3. Conecte sua conta do GitHub e selecione o repositório `Assessoria-Corre-Junto`.
4. O Firebase detectará automaticamente que é um app **Next.js** e fará o deploy.
5. Repositório: `https://github.com/rbonapaz-Bonapaz/Assessoria-Corre-Junto`

## 📱 Sincronização em Tempo Real
O CorreJunto usa o motor **Firestore Real-Time**:
- **No PC:** Use para planejar ciclos longos e análise técnica.
- **No Celular:** Use na pista. Seus treinos aparecem instantaneamente.
- **Dica:** Use o login por **E-mail e Senha** se preferir não usar a conta Google no celular.

## 🧠 Gemini Coach
O treinador IA tem acesso ao seu histórico para ajustar o T-Pace automaticamente através da sua Gemini API Key configurada no app.