
# 🏃‍♂️ CORRE JUNTO - Laboratório de Performance

Sua plataforma de elite para periodização e análise biomecânica, operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 RESOLVENDO O LOGIN E DEPLOY (Deploy via GitHub)

O app está configurado para a sua nova chave de API: `AIzaSyBTHlgY_B4gElAUJ_d85xcgSThfLWw6iFo`. 

### 1. Desbloqueio da Chave (Obrigatório)
1. Acesse o [Google Cloud Console - Credenciais](https://console.cloud.google.com/apis/credentials).
2. Clique na chave `AIzaSyBTHlgY_B4gElAUJ_d85xcgSThfLWw6iFo`.
3. Role até **"Restrições de API"**.
4. Selecione **"Não restringir chave"** (Don't restrict key).
5. Clique em **SALVAR**.

### 2. Autorizar o Domínio do Laboratório
1. Acesse: [Firebase Console - Domínios Autorizados](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Clique em **"Adicionar domínio"**.
3. Adicione o seu link do laboratório (ex: `studio-1669701209...cloudworkstations.dev`).
4. **Importante:** Quando você fizer o deploy definitivo, adicione também o domínio final gerado pelo Firebase Hosting.

### 3. Deploy Automático via GitHub
Para que o seu repositório `https://github.com/rbonapaz-Bonapaz/Acessoria-Corre-Junto` seja publicado automaticamente:
1. No Firebase Console, vá em **App Hosting**.
2. Clique em **"Começar"**.
3. Conecte sua conta do GitHub e selecione o repositório `Acessoria-Corre-Junto`.
4. O Firebase detectará automaticamente que é um app **Next.js** e fará o deploy.

## 📱 Sincronização em Tempo Real
O CorreJunto usa o motor **Firestore Real-Time**:
- **No PC:** Use para planejar ciclos longos e análise técnica.
- **No Celular:** Use na pista. Seus treinos aparecem instantaneamente.
- **Dica:** Use o login por **E-mail e Senha** se preferir não usar a conta Google no celular.

## 🧠 Gemini Coach
O treinador IA tem acesso ao seu histórico para ajustar o T-Pace automaticamente através da sua Gemini API Key configurada no app.
