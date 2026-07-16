"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { chatWithAICoach } from "@/ai/flows/chat-with-ai-coach";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  Bot, 
  User, 
  Loader2, 
  MessageSquare,
  History,
  Copy,
  Check,
  Paperclip,
  X,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, fileToDataURI } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";

type Message = {
  id?: string;
  role: "user" | "model";
  parts: string;
  image?: string;
  createdAt?: any;
};

export default function CoachPage() {
  const context = React.useContext(TrainingContext);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const profile = context?.activeProfile;
  const plan = context?.trainingPlan;

  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [attachedImage, setAttachedImage] = React.useState<string | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync real-time com o chat do Firestore
  React.useEffect(() => {
    if (!user || !firestore) return;

    const messagesRef = collection(firestore, 'user_data', user.uid, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [user, firestore]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copiado!" });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uri = await fileToDataURI(file);
      setAttachedImage(uri);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachedImage) || loading || !user || !firestore) return;

    if (!context?.apiKey) {
      toast({ variant: "destructive", title: "IA Desativada", description: "Configure sua Gemini API Key no menu lateral." });
      return;
    }

    const messagesRef = collection(firestore, 'user_data', user.uid, 'messages');
    
    // Salva a mensagem do usuário
    const userMsgData: Message = { 
      role: "user", 
      parts: input, 
      image: attachedImage || undefined,
      createdAt: serverTimestamp()
    };
    
    const currentInput = input;
    const currentImage = attachedImage;
    
    setInput("");
    setAttachedImage(null);
    setLoading(true);

    try {
      await addDoc(messagesRef, userMsgData);

      const workoutHistoryContext = `Perfil: ${profile?.name || 'Atleta'}. Peso: ${profile?.currentWeight}kg. Pace T: ${profile?.thresholdPace}. FC Limiar: ${profile?.thresholdHr}bpm.`;
      const planContext = plan ? `Atualmente no bloco ${plan.blockType}. Objetivo: ${profile?.raceDistance} em ${profile?.raceDate}.` : "Sem plano ativo no momento.";
      const anamnesisContext = context.getAnamnesisSummary();

      const response = await chatWithAICoach({
        apiKey: context.apiKey || undefined,
        conversationHistory: messages.map(m => ({ role: m.role, parts: m.parts })),
        workoutHistory: workoutHistoryContext,
        trainingPlan: planContext,
        anamnesis: anamnesisContext,
        imageDataUri: currentImage || undefined
      });

      // Salva a resposta da IA
      await addDoc(messagesRef, {
        role: "model",
        parts: response.feedback,
        createdAt: serverTimestamp()
      });

    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível sincronizar sua conversa." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">
        <div className="text-center space-y-2">
          <h1 className="font-headline text-4xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
            GEMINI <span className="text-primary">COACH</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg font-medium">
            Sincronizado entre todos os seus dispositivos.
          </p>
        </div>

        <Tabs defaultValue="conversar" className="w-full space-y-8">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/20 p-1.5 rounded-2xl h-auto gap-2">
            <TabsTrigger 
              value="conversar" 
              className="py-4 font-headline font-black text-xs md:text-sm uppercase italic gap-2 data-[state=active]:bg-primary data-[state=active]:text-black transition-all rounded-xl"
            >
              <MessageSquare className="size-4" /> Conversar
            </TabsTrigger>
            <TabsTrigger 
              value="historico" 
              className="py-4 font-headline font-black text-xs md:text-sm uppercase italic gap-2 data-[state=active]:bg-primary data-[state=active]:text-black transition-all rounded-xl"
            >
              <History className="size-4" /> Arquivo
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversar" className="mt-0 animate-in slide-in-from-bottom-4 duration-500">
            <Card className="bg-card/40 border-border/50 flex flex-col h-[600px] overflow-hidden rounded-3xl shadow-2xl relative">
              <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-8" ref={scrollRef}>
                  <div className="space-y-10">
                    {messages.length === 0 && !loading && (
                      <div className="text-center py-20 text-muted-foreground">
                        <Sparkles className="mx-auto size-12 mb-4 opacity-20" />
                        <p className="font-headline font-black uppercase italic tracking-widest">Inicie seu laboratório técnico</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div 
                        key={msg.id || i} 
                        className={cn(
                          "flex items-start gap-4 group",
                          msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <Avatar className={cn(
                          "size-10 border-2",
                          msg.role === 'model' ? "border-primary bg-primary" : "border-border bg-secondary"
                        )}>
                          <AvatarFallback className="font-black">
                            {msg.role === 'model' ? <Bot className="size-6 text-black" /> : <User className="size-6 text-white" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "max-w-[80%] relative rounded-2xl p-5 text-sm leading-relaxed shadow-xl",
                          msg.role === 'user' 
                            ? "bg-primary text-black font-black italic rounded-tr-none" 
                            : "bg-black/30 border border-border/50 text-white italic rounded-tl-none"
                        )}>
                          {msg.image && (
                            <div className="mb-4 rounded-xl overflow-hidden border border-white/20">
                              <img src={msg.image} alt="Anexo" className="w-full h-auto max-h-60 object-contain" />
                            </div>
                          )}
                          {msg.parts}
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleCopy(msg.parts, msg.id || i.toString())}
                            className={cn(
                              "absolute -bottom-10 opacity-0 group-hover:opacity-100 transition-opacity size-8 text-muted-foreground",
                              msg.role === 'user' ? "left-0" : "right-0"
                            )}
                          >
                            {copiedId === (msg.id || i.toString()) ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                          </Button>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex items-start gap-4 animate-pulse">
                        <Avatar className="size-10 border-2 border-primary bg-primary"><AvatarFallback><Bot className="size-6 text-black" /></AvatarFallback></Avatar>
                        <div className="bg-black/30 border border-border/50 rounded-2xl rounded-tl-none p-5 flex items-center gap-3">
                          <Loader2 className="size-4 animate-spin text-primary" />
                          <span className="text-[10px] font-black uppercase italic tracking-widest text-muted-foreground">Analisando na nuvem...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-6 border-t border-border/20 bg-secondary/10 flex-col gap-4">
                {attachedImage && (
                  <div className="w-full flex items-center gap-3 p-2 bg-secondary/50 border border-primary/30 rounded-xl">
                    <div className="size-12 rounded-lg overflow-hidden border border-border">
                      <img src={attachedImage} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                    <Button variant="ghost" size="icon" className="size-8" onClick={() => setAttachedImage(null)}>
                      <X className="size-4" />
                    </Button>
                  </div>
                )}
                
                <div className="flex w-full gap-4 items-center">
                  <div className="flex-1 relative">
                    <Input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Pergunte ou anexe um print de treino..."
                      className="bg-black/30 border-border/50 h-16 px-6 pr-24 rounded-2xl font-medium italic border-2"
                    />
                    <div className="absolute right-3 top-3 flex gap-2">
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                      <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="size-10"><Paperclip size={20} /></Button>
                      <Button onClick={handleSend} disabled={loading} size="icon" className="size-10 bg-primary text-black"><Send size={20} /></Button>
                    </div>
                  </div>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
