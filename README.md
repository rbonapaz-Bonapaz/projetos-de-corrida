# 🏃‍♂️ CORRE JUNTO - Laboratório de Performance

Sua plataforma de elite para periodização e análise biomecânica, operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 RESOLVENDO O BLOQUEIO DE LOGIN (Nova Chave Aplicada)

Você criou uma nova chave de API: `AIzaSyBTHlgY_B4gElAUJ_d85xcgSThfLWw6iFo`. O app já foi atualizado para usá-la. Para que o login funcione, siga estes passos obrigatórios:

### 1. Garantir o Desbloqueio da Chave
1. Acesse o [Google Cloud Console - Credenciais](https://console.cloud.google.com/apis/credentials).
2. Clique na chave que você acabou de criar.
3. Role até **"Restrições de API"**.
4. Selecione **"Não restringir chave"** (Don't restrict key).
5. Clique em **SALVAR**.

### 2. Autorizar o Domínio (Obrigatório)
Mesmo com a chave liberada, o Google exige que você autorize o link do seu laboratório:
1. Acesse: [Firebase Console - Domínios Autorizados](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Clique em **"Adicionar domínio"**.
3. Cole o link do seu laboratório (ex: `https://studio-1669701209...cloudworkstations.dev`).
4. Clique em **Adicionar**.

## 📱 Sincronização em Tempo Real
O CorreJunto usa o motor **Firestore Real-Time**:
- **No PC:** Use para planejar ciclos longos e análise técnica.
- **No Celular:** Use na pista. Seus treinos aparecem instantaneamente.
- **Dica:** Use o login por **E-mail e Senha** se preferir não usar a conta Google no celular da assessoria.

## 🧠 Gemini Coach
O treinador IA tem acesso ao seu histórico para ajustar o T-Pace automaticamente. Se usar uma planilha física, tire uma foto e anexe no Perfil para a IA traduzir para o digital.
