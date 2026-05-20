
# 🏃‍♂️ CORRE JUNTO - Performance Atlética

Laboratório de performance operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 RESOLVENDO O BLOQUEIO DE LOGIN (Visto no seu Print)

Pelo print enviado, a sua chave de API está restringindo o acesso apenas à Gemini API. Siga estes passos na tela **"Editar chave de API"** que você abriu ao clicar em "Assessoria Corre Junto":

### 1. Adicionar APIs de Identidade na Chave
1. Na seção **"Restrições de API"**, clique no seletor onde aparece **"1 API"** (Gemini API).
2. Procure por **Identity Toolkit API** na lista e marque-a.
3. Procure também por **Token Service API** e marque-a.
4. Clique em **SALVAR** no botão azul no rodapé.

### 2. Autorizar o Domínio no Firebase (Obrigatório)
Mesmo com a chave corrigida, o Google bloqueia o login se o link do site não estiver na "Lista Branca".
1. Acesse o [Firebase Console - Authorized Domains](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Vá em **Authentication > Settings > Authorized Domains**.
3. Clique em **"Add Domain"**.
4. Cole o link do seu laboratório (o link que você vê na barra de endereços, ex: `https://studio-1669701209...cloudworkstations.dev`).
5. Clique em **Add**.

## 📱 Sincronização em Tempo Real
- O app usa Firestore `onSnapshot`. 
- **PC:** Use para planejar treinos e analisar arquivos .FIT pesados.
- **Celular:** Use na pista para consultar o plano e dar feedback imediato.
- **Dica:** No celular, use "Adicionar à tela de início" para usar como um app nativo.

## 🧠 Gemini Coach
O treinador IA tem acesso ao seu histórico e biometria para ajustar o T-Pace e ritmos de tiro automaticamente baseados no seu VDOT.
