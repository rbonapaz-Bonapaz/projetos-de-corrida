# 🏃‍♂️ CORRE JUNTO - Laboratório de Performance

Sua plataforma de elite para periodização e análise biomecânica.

## 🚀 COMO REALIZAR O DEPLOY (RESOLVENDO ERRO 'OUT')

Para que o Firebase Hosting encontre os arquivos, você deve gerar o build antes de enviar:

1. No terminal, execute o comando de build:
   ```bash
   npm run build
   ```
   *Isso criará a pasta `out/` com seu site estático.*

2. Após o build terminar com sucesso, execute o deploy:
   ```bash
   firebase deploy --only hosting
   ```

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
- **Biometria IA:** O Gemini Coach analisa seus arquivos .FIT e feedbacks instantaneamente.
