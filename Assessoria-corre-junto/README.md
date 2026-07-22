# 🏃‍♂️ CORRE JUNTO - Laboratório de Performance

## 🚀 COMO PUBLICAR

### Opção 1: Pelo Terminal (Recomendado)
Se o terminal estiver funcionando, digite o comando abaixo para realizar o build e o deploy automático:
```bash
npm run deploy
```

### Opção 2: Sem Terminal (Botão Publicar)
Como você está no **Firebase Studio**, a publicação pode ser feita via interface:
1. Clique no ícone de **"Publish"** (Nuvem ou Foguete) no menu lateral ou superior.
2. O Studio processará seu código e enviará para a URL do seu projeto.

---

## ⚠️ CONFIGURAÇÃO DA IA (MUITO IMPORTANTE)
Para que a IA gere seus planos de treino, você **DEVE** configurar sua chave de API do Google Gemini:

1. Vá ao [Google AI Studio](https://aistudio.google.com/) e gere uma chave gratuita.
2. No painel do **Firebase Console**, vá em **App Hosting** ou **Functions** (dependendo de onde o backend está rodando).
3. Adicione uma variável de ambiente chamada `GEMINI_API_KEY` com o valor da sua chave.
4. **Sem esta chave, o sistema retornará erro ao tentar gerar o ciclo.**

---

## 📱 FUNCIONALIDADES DE ELITE
- **Acesso Biométrico**: Login via Digital ou FaceID.
- **Semana Espelho Multimodal**: Anamnese via texto ou arquivos de sensores (.FIT/Prints).
- **Diretriz de IA**: Paces numéricos exatos baseados em VDOT.
- **Sincronização Cloud**: Seus dados são salvos no Firestore e acessíveis em qualquer dispositivo.
