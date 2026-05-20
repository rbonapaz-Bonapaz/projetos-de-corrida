
# 🏃‍♂️ CORRE JUNTO - Performance Atlética

Laboratório de performance operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 RESOLVENDO O BLOQUEIO DE LOGIN (Visto no seu Print)

Pelo print enviado, a sua chave de API está restringindo o acesso apenas à Gemini API. Siga estes passos na tela **"Editar chave de API"** que você abriu:

### 1. Adicionar API de Identidade
1. Na seção **"APIs que podem ser acessadas usando esta chave"**, clique no seletor onde aparece **"1 API"**.
2. Procure por **Identity Toolkit API** na lista e marque-a.
3. (Opcional mas recomendado) Procure também por **Token Service API** e marque-a.
4. Clique em **SALVAR** no botão azul no rodapé.

### 2. Autorizar o Domínio no Firebase (Obrigatório para PC e Celular)
1. Acesse o [Firebase Console](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Vá em **Authentication > Settings > Authorized Domains**.
3. Clique em **"Add Domain"**.
4. Cole o link do seu laboratório (o link que termina em `.cloudworkstations.dev`).

## 📱 Sincronização em Tempo Real
- O app usa Firestore `onSnapshot`. 
- **PC:** Use para planejar treinos e analisar arquivos .FIT pesados.
- **Celular:** Use na pista para consultar o plano e dar feedback imediato.
- **Dica:** No celular, use "Adicionar à tela de início" para usar como um app nativo.

## 🧠 Gemini Coach
O treinador IA tem acesso ao seu histórico e biometria para ajustar o T-Pace e ritmos de tiro automaticamente baseados no seu VDOT.
