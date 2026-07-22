"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { chatWithCoachAction } from "@/ai/actions";
import { TrainingContext } from "@/contexts/TrainingContext";
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
      <div className="flex flex-col h-[calc(100svh-9rem)] lg:h-[calc(100svh-8rem)]">
        <div className="mb-4 shrink-0">
          <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
            <Sparkles className="size-6 text-primary" /> Coach IA
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">Converse sobre seus treinos e sensações.</p>
        </div>

        <Tabs defaultValue="conversar" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 h-10 rounded-xl shrink-0 mb-4">
            <TabsTrigger value="conversar" className="text-xs font-semibold rounded-lg gap-1.5">
              <MessageSquare className="size-3.5" /> Conversar
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-xs font-semibold rounded-lg gap-1.5">
              <History className="size-3.5" /> Histórico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="conversar" className="mt-0 flex-1 overflow-hidden">
            <div className="card-plain flex flex-col h-full !p-0 overflow-hidden">
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full p-4 md:p-6" ref={scrollRef}>
                  <div className="space-y-5 pb-4">
                    {messages.length === 0 && !loading && (
                      <div className="text-center py-16 text-muted-foreground/50 flex flex-col items-center gap-3">
                        <Sparkles className="size-10 animate-pulse" />
                        <p className="text-[13px] max-w-xs">Relate um treino ou peça um ajuste no seu plano.</p>
                      </div>
                    )}
                    {messages.map((msg, i) => (
                      <div key={msg.id || i} className={cn("flex items-start gap-2.5", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                        <Avatar className={cn("size-8 shrink-0", msg.role === 'model' ? "bg-primary" : "bg-secondary")}>
                          <AvatarFallback className="bg-transparent">
                            {msg.role === 'model' ? <Bot className="size-4 text-primary-foreground" /> : <User className="size-4" />}
                          </AvatarFallback>
                        </Avatar>
                        <div className={cn(
                          "max-w-[85%] md:max-w-[70%] rounded-2xl p-3.5 text-[13px] leading-relaxed",
                          msg.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-secondary/50 border border-border rounded-tl-sm"
                        )}>
                          {msg.image && <img src={msg.image} alt="Anexo" className="mb-2.5 rounded-lg w-full max-h-60 object-contain border border-border" />}
                          <div className="whitespace-pre-wrap">{msg.parts}</div>
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex items-start gap-2.5">
                        <Avatar className="size-8 bg-primary shrink-0"><AvatarFallback className="bg-transparent"><Bot className="size-4 text-primary-foreground" /></AvatarFallback></Avatar>
                        <div className="bg-secondary/50 border border-border rounded-2xl rounded-tl-sm p-3.5 flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin text-primary" />
                          <span className="text-[12px] text-muted-foreground">Analisando…</span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="p-3 md:p-4 border-t border-border flex flex-col gap-2.5 shrink-0">
                {attachedImage && (
                  <div className="w-full flex items-center justify-between gap-2 p-2 bg-primary/10 border border-primary/20 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <img src={attachedImage} className="size-10 rounded-lg object-cover border border-border" alt="Preview" />
                      <p className="text-[11px] font-semibold text-primary">Imagem pronta</p>
                    </div>
                    <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => setAttachedImage(null)}><X className="size-4" /></Button>
                  </div>
                )}

                <div className="relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Relate seu treino ou dor…"
                    className="h-11 pr-24 rounded-xl text-sm"
                  />
                  <div className="absolute right-1.5 top-1.5 flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="size-8 rounded-lg text-muted-foreground hover:text-primary">
                      <Paperclip size={16} />
                    </Button>
                    <Button onClick={handleSend} disabled={loading || (!input.trim() && !attachedImage)} size="icon" className="size-8 rounded-lg">
                      <Send size={16} />
                    </Button>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                    if (e.target.files?.[0]) setAttachedImage(await fileToDataURI(e.target.files[0]));
                  }} />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
