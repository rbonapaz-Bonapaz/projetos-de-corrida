
# 🏃‍♂️ CORRE JUNTO - Laboratório de Performance

Sua plataforma de elite para periodização e análise biomecânica, operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 RESOLVENDO O BLOQUEIO DE LOGIN (Visto no seu Print)

Pelo seu print, o Google está bloqueando o login porque a chave está restrita apenas ao Gemini. Siga estes passos para liberar agora:

### 1. Desbloquear a Chave de API (Na tela do seu print)
1. Procure a seção **"APIs que podem ser acessadas usando esta chave"**.
2. Onde está escrito **"1 API"** (que é o Gemini), clique e mude para **"Não restringir chave"** (ou "Don't restrict key").
3. **MUITO IMPORTANTE:** Role até o final da página e clique no botão azul **SALVAR**.
4. Aguarde 2 minutos e tente logar novamente no app.

### 2. Autorizar o Domínio (Obrigatório para o Google Login)
Mesmo com a chave liberada, o Google exige que você diga que o seu site é confiável:
1. Acesse: [Firebase Console - Domínios Autorizados](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Clique em **"Adicionar domínio"**.
3. Cole o link do seu laboratório (ex: `https://studio-1669701209...cloudworkstations.dev`).
4. Clique em **Adicionar**.

## 📱 Sincronização PC ↔ Celular
O CorreJunto usa o motor **Firestore Real-Time**:
- **No PC:** Use para planejar ciclos longos, analisar arquivos .FIT e configurar seu perfil detalhado.
- **No Celular:** Use na pista ou academia. O treino do dia e o feedback do Coach IA aparecem instantaneamente.
- **Dica:** No Android/iPhone, use a opção "Adicionar à tela de início" para ter o ícone do CorreJunto como um app nativo.

## 🧠 Gemini Coach
O treinador IA tem acesso ao seu histórico e biometria para ajustar o T-Pace e ritmos de tiro automaticamente baseados no seu VDOT, sem que você precise calcular nada manualmente.
