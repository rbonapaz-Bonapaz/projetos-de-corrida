# 🏃‍♂️ CORRE JUNTO - Laboratório de Performance

Sua plataforma de elite para periodização e análise biomecânica.

## 🚀 RESOLVENDO O BLOQUEIO DE LOGIN (URGENTE)

Se você vir o erro "requests-to-this-api... are blocked", siga estes passos:

### 1. Desbloqueio da Chave no Google Cloud
1. Acesse o [Google Cloud Console - Credenciais](https://console.cloud.google.com/apis/credentials).
2. Clique na sua chave `AIzaSyBTHlgY_B4gElAUJ_d85xcgSThfLWw6iFo`.
3. Em **"Restrições de API"**, selecione a opção **"Nenhuma"** (Don't restrict key).
4. Clique em **SALVAR**.
   *Isso libera o Identity Toolkit usado pelo Firebase Auth.*

### 2. Autorizar o Domínio do Laboratório
1. Acesse: [Firebase Console - Domínios Autorizados](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Clique em **"Adicionar domínio"**.
3. Adicione os domínios:
   - `studio-1669701209-88700.web.app`
   - `studio-1669701209-88700.firebaseapp.com`

### 3. Deploy Automático via GitHub
Para sincronização contínua:
1. No Firebase Console, vá em **App Hosting**.
2. Clique em **"Começar"**.
3. Conecte seu GitHub: `https://github.com/rbonapaz-Bonapaz/Assessoria-Corre-Junto`
4. O Firebase fará o build automaticamente usando as variáveis configuradas.

## 📱 Sincronização Cloud
- **Sincronização:** PC e Celular conversam em tempo real via Firestore.
- **Biometria IA:** O Gemini Coach analisa seus arquivos .FIT e feedbacks instantaneamente.
