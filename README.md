# 🏃‍♂️ CORRE JUNTO - Laboratório de Performance

Sua plataforma de elite para periodização e análise biomecânica.

## 🚀 COMO REALIZAR O DEPLOY (MODO DINÂMICO)

Como o sistema utiliza Inteligência Artificial e Server Actions, ele deve ser implantado usando o **Firebase App Hosting** ou configurado para o modo dinâmico:

1. **Firebase App Hosting (Recomendado):**
   - Conecte seu repositório GitHub ao Console do Firebase em "App Hosting".
   - O Firebase detectará automaticamente o Next.js e fará o build dinâmico.

2. **Firebase Hosting Tradicional (com Functions):**
   - Execute o comando:
     ```bash
     firebase deploy
     ```
   - O Firebase CLI detectará o Next.js e criará as funções de servidor necessárias automaticamente.

## 🛠️ RESOLVENDO O BLOQUEIO DE LOGIN

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

## 📱 Sincronização Cloud
- **Sincronização:** PC e Celular conversam em tempo real via Firestore.
- **Biometria IA:** O Gemini Coach analisa seus arquivos .FIT e feedbacks instantaneamente utilizando o contexto da sua Anamnese Técnica.
