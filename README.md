# 🏃‍♂️ CORRE JUNTO - Laboratório de Performance

Sua plataforma de elite para periodização e análise biomecânica.

## 🚀 COMO REALIZAR O DEPLOY (MODO DINÂMICO)

Como o sistema utiliza Next.js 15 com Server Actions e Genkit, ele deve ser implantado de uma das duas formas abaixo:

### 1. Firebase App Hosting (Recomendado)
Este é o novo padrão do Firebase para Next.js:
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Vá em **App Hosting** e clique em "Começar".
3. Conecte seu repositório GitHub. O Firebase cuidará de todo o build dinâmico automaticamente.

### 2. Firebase Hosting (Via CLI com Web Frameworks)
Se preferir usar o terminal, você **precisa habilitar o experimento** antes:
1. No seu terminal, execute:
   ```bash
   firebase experiments:enable webframeworks
   ```
2. Depois, realize o deploy:
   ```bash
   firebase deploy
   ```

## 🛠️ RESOLVENDO O BLOQUEIO DE LOGIN

Se você vir o erro "requests-to-this-api... are blocked", siga estes passos:

### 1. Desbloqueio da Chave no Google Cloud
1. Acesse o [Google Cloud Console - Credenciais](https://console.cloud.google.com/apis/credentials).
2. Clique na sua chave `AIzaSyBTHlgY_B4gElAUJ_d85xcgSThfLWw6iFo`.
3. Em **"Restrições de API"**, selecione a opção **"Nenhuma"** (Don't restrict key).
4. Clique em **SALVAR**.

### 2. Autorizar o Domínio do Laboratório
1. Acesse: [Firebase Console - Domínios Autorizados](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Adicione os domínios:
   - `studio-1669701209-88700.web.app`
   - `studio-1669701209-88700.firebaseapp.com`

## 📱 Sincronização Cloud
- **Sincronização:** PC e Celular conversam em tempo real via Firestore.
- **Segurança:** As regras de segurança em `firestore.rules` garantem que apenas VOCÊ acesse seus dados biométricos.