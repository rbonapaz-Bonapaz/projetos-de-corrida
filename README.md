
# 🏃‍♂️ CORRE JUNTO - Performance Atlética

Laboratório de performance operando em arquitetura **Cloud-First** via Firebase Firestore.

## 🚀 RESOLVENDO O BLOQUEIO DE LOGIN (Visto no seu Print)

Pelo seu print, o Google não deixa você marcar a caixa porque as APIs selecionadas estão entrando em conflito. A solução definitiva é:

### 1. Remover a Restrição da Chave (O mais fácil)
1. Na tela de edição da chave **"Assessoria Corre Junto"**, procure a seção **"Restrições de API"**.
2. Em vez de selecionar APIs manualmente, marque a opção **"Nenhuma"** (ou "Don't restrict key").
3. Clique em **SALVAR** no rodapé azul. Isso libera o login e o Gemini instantaneamente.

### 2. Autorizar o Domínio no Firebase (Obrigatório)
Mesmo com a chave liberada, o login falhará se o domínio não estiver autorizado:
1. Acesse o [Firebase Console - Authorized Domains](https://console.firebase.google.com/project/studio-1669701209-88700/authentication/settings).
2. Clique em **"Add Domain"**.
3. Cole o link do seu laboratório (ex: `https://studio-1669701209...cloudworkstations.dev`).
4. Clique em **Add**.

## 📱 Sincronização em Tempo Real
- O app usa Firestore `onSnapshot`. 
- **PC:** Use para planejar treinos e analisar arquivos .FIT pesados.
- **Celular:** Use na pista para consultar o plano e dar feedback imediato.
- **Dica:** No celular, use "Adicionar à tela de início" para usar como um app nativo.

## 🧠 Gemini Coach
O treinador IA tem acesso ao seu histórico e biometria para ajustar o T-Pace e ritmos de tiro automaticamente baseados no seu VDOT.
