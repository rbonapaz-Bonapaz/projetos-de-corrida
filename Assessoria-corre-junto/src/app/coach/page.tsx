"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { chatWithCoachAction } from "@/ai/actions";
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
  Paperclip,
  X,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn, fileToDataURI } from "@/lib/utils";
import { useUser, useFirestore } from "@/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError, type SecurityRuleContext } from "@/firebase/errors";

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
  const [messages, setMessages] = React.useState<Message[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Efeito para sincronizar com Firestore se logado
  React.useEffect(() => {
    if (!user || !firestore) return;

    const messagesRef = collection(firestore, 'user_data', user.uid, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      if (msgs.length > 0) setMessages(msgs);
    }, async () => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: messagesRef.path,
        operation: 'list',
      } satisfies SecurityRuleContext));
    });

    return () => unsubscribe();
  }, [user, firestore]);

  // Scroll automático
  React.useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages, loading]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if ((!trimmedInput && !attachedImage) || loading) return;

    const currentInput = trimmedInput;
    const currentImage = attachedImage;
    
    // UI Feedback imediato
    const userMsg: Message = { 
      role: "user", 
      parts: currentInput, 
      image: currentImage || undefined, 
      createdAt: new Date() 
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setAttachedImage(null);
    setLoading(true);

    // Persistência Cloud (Se logado)
    if (user && firestore) {
      const messagesRef = collection(firestore, 'user_data', user.uid, 'messages');
      addDoc(messagesRef, { ...userMsg, createdAt: serverTimestamp() }).catch(async () => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: messagesRef.path, operation: 'create', requestResourceData: userMsg
        } satisfies SecurityRuleContext));
      });
    }

    try {
      const workoutHistoryContext = `Perfil: ${profile?.name || 'Atleta'}. Peso: ${profile?.currentWeight || '--'}kg. Pace T: ${profile?.thresholdPace || '--'}. FC Limiar: ${profile?.thresholdHr || '--'}bpm.`;
      
      const response = await chatWithCoachAction({
        conversationHistory: messages.concat(userMsg).map(m => ({ role: m.role, parts: m.parts })),
        workoutHistory: workoutHistoryContext,
        trainingPlan: plan ? `Bloco ${plan.blockType}. Prova ${profile?.raceName}.` : "Sem plano ativo.",
        anamnesis: context?.getAnamnesisSummary(),
        imageDataUri: currentImage || undefined
      });

      const modelMsg: Message = { 
        role: "model", 
        parts: response.feedback, 
        createdAt: new Date() 
      };

      setMessages(prev => [...prev, modelMsg]);

      if (user && firestore) {
        const messagesRef = collection(firestore, 'user_data', user.uid, 'messages');
        addDoc(messagesRef, { ...modelMsg, createdAt: serverTimestamp() }).catch(async () => {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: messagesRef.path, operation: 'create', requestResourceData: modelMsg
          } satisfies SecurityRuleContext));
        });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na IA", description: "Verifique sua conexão ou API Key." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-4 md:space-y-10 h-[calc(100svh-8rem)] md:h-auto flex flex-col animate-in fade-in duration-700">
        <div className="text-center shrink-0 px-2">
          <h1 className="font-headline text-2xl md:text-5xl font-black uppercase italic tracking-tighter text-white leading-none">
            GEMINI <span className="text-primary">COACH</span>
          </h1>
          <p className="text-muted-foreground text-[7px] md:text-sm font-bold uppercase tracking-widest italic mt-1 opacity-60">Sincronizado via Cloud Elite</p>
        </div>

        <Tabs defaultValue="conversar" className="w-full flex-1 flex flex-col space-y-3 md:space-y-8 overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/20 p-1 rounded-xl md:rounded-2xl h-auto gap-1 shadow-inner shrink-0">
            <TabsTrigger value="conversar" className="py-2 md:py-4 font-headline font-black text-[8px] md:text-sm uppercase italic gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg md:rounded-xl">
              <MessageSquare className="size-3 md:size-4" /> Conversar
            </TabsTrigger>
            <TabsTrigger value="historico" className="py-2 md:py-4 font-headline font-black text-[8px] md:text-sm uppercase italic gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-black rounded-lg md:rounded-xl">
              <History className="size-3 md:size-4" /> Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversar" className="mt-0 flex-1 overflow-hidden">
            <Card className="bg-card/40 border-border/50 flex flex-col h-full md:h-[650px] overflow-hidden rounded-[1.25rem] md:rounded-[2.5rem] shadow-2xl relative">
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full p-4 md:p-12" ref={scrollRef}>
                  <div className="space-y-6 md:space-y-12 pb-4">
                    {messages.length === 0 && !loading && (
                      <div className="text-center py-10 md:py-20 text-muted-foreground/30 flex flex-col items-center space-y-4">
                        <Sparkles className="size-10 md:size-16 animate-pulse" />
                        <p className="font-headline font-black uppercase italic text-[8px] md:text-xs tracking-widest text-center">Inicie seu laboratório técnico.<br/>Relate um treino ou peça um ajuste.</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div key={msg.id || i} className={cn("flex items-start gap-2.5 md:gap-4 animate-in slide-in-from-bottom-2 duration-300", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                        <Avatar className={cn("size-7 md:size-12 border-2 shadow-xl shrink-0", msg.role === 'model' ? "border-primary bg-primary" : "border-border/50 bg-secondary")}>
                          <AvatarFallback className="font-black italic text-[10px] md:text-lg">
                            {msg.role === 'model' ? <Bot className="size-3 md:size-6 text-black" /> : <User className="size-3 md:size-6 text-white" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "max-w-[85%] md:max-w-[70%] rounded-xl md:rounded-3xl p-3 md:p-6 text-[11px] md:text-base leading-relaxed shadow-xl",
                          msg.role === 'user' ? "bg-primary text-black font-bold italic rounded-tr-none" : "bg-black/40 border border-white/5 text-white italic rounded-tl-none"
                        )}>
                          {msg.image && <img src={msg.image} alt="Anexo" className="mb-3 rounded-lg w-full max-h-40 md:max-h-80 object-contain border border-white/10" />}
                          <div className="whitespace-pre-wrap">{msg.parts}</div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex items-start gap-2.5 animate-in fade-in">
                        <Avatar className="size-7 md:size-12 border-2 border-primary bg-primary shrink-0"><AvatarFallback><Bot className="size-3 md:size-6 text-black" /></AvatarFallback></Avatar>
                        <div className="bg-black/40 border border-white/5 rounded-xl md:rounded-3xl rounded-tl-none p-3 md:p-6 flex items-center gap-2 shadow-xl">
                          <Loader2 className="size-3 md:size-5 animate-spin text-primary" />
                          <span className="text-[7px] md:text-[10px] font-black uppercase italic text-muted-foreground/60">Analisando Biometria...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>

              <CardFooter className="p-3 md:p-8 border-t border-white/5 bg-secondary/10 flex-col gap-3 md:gap-6">
                {attachedImage && (
                  <div className="w-full flex items-center justify-between gap-2 p-1.5 md:p-3 bg-primary/10 border border-primary/30 rounded-lg md:rounded-2xl animate-in zoom-in-95">
                    <div className="flex items-center gap-2 md:gap-4">
                      <img src={attachedImage} className="size-10 md:size-16 rounded-lg object-cover border border-white/20" alt="Preview" />
                      <div className="space-y-0.5">
                        <p className="text-[8px] md:text-[10px] font-black uppercase italic text-primary leading-none">Imagem Pronta</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="size-7 md:size-10 rounded-full" onClick={() => setAttachedImage(null)}><X className="size-3 md:size-5" /></Button>
                  </div>
                )}
                
                <div className="flex w-full gap-2 items-center">
                  <div className="flex-1 relative group">
                    <Input 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Relate seu treino ou dor..."
                      className="bg-black/40 border-white/5 h-11 md:h-16 px-4 md:px-8 pr-16 md:pr-28 rounded-xl md:rounded-2xl font-bold italic border-2 focus:border-primary text-xs md:text-sm"
                    />
                    <div className="absolute right-1.5 top-1.5 md:right-3 md:top-3 flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="size-8 md:size-10 rounded-lg text-muted-foreground hover:text-primary"><Paperclip size={16} /></Button>
                      <Button onClick={handleSend} disabled={loading || (!input.trim() && !attachedImage)} size="icon" className="size-8 md:size-10 bg-primary text-black rounded-lg shadow-xl active:scale-90"><Send size={16} /></Button>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                      if (e.target.files?.[0]) setAttachedImage(await fileToDataURI(e.target.files[0]));
                    }} />
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