
"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  ClipboardList, 
  FileDown, 
  Stethoscope, 
  Activity, 
  Target, 
  Zap, 
  Heart,
  Save,
  Loader2,
  Clock,
  Dumbbell,
  Smartphone,
  Trophy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Script from "next/script";

const weekDays = [
  { id: 'Seg', label: 'Segunda' },
  { id: 'Ter', label: 'Terça' },
  { id: 'Qua', label: 'Quarta' },
  { id: 'Qui', label: 'Quinta' },
  { id: 'Sex', label: 'Sexta' },
  { id: 'Sab', label: 'Sábado' },
  { id: 'Dom', label: 'Domingo' },
];

export default function AnamnesisPage() {
  const context = React.useContext(TrainingContext);
  const { toast } = useToast();
  const profile = context?.activeProfile;
  const [isSaving, setIsSaving] = React.useState(false);

  const [formData, setFormData] = React.useState<any>({
    whatsapp: "",
    profession: "",
    emergencyContact: "",
    medicalRelease: "",
    chronicIllness: "Não",
    chronicIllnessDetail: "",
    medication: "",
    injuryHistory: [],
    activeInjuries: "",
    practiceTime: "",
    consistency: "",
    mirrorWeek: "",
    easyPace: "",
    hardPace: "",
    trainingStructure: "",
    footwear: "",
    recentRecord: "",
    maxContinuousDistance: "",
    preferredShift: "",
    timeWeekdays: "",
    timeWeekends: "",
    strengthDays: [],
    strengthFocus: "",
    strengthLocation: "",
    intensityMonitoring: "",
    terrain: "",
    devices: [],
    biggestDifficulty: "",
    commitmentLevel: 10,
    sleepQuality: 3,
    stressLevel: 3,
    dietClassification: "",
    objective: "",
    targetRace: ""
  });

  React.useEffect(() => {
    if (profile?.anamnesis) {
      setFormData((prev: any) => ({
        ...prev,
        ...profile.anamnesis,
        injuryHistory: profile.anamnesis.injuryHistory || [],
        strengthDays: profile.anamnesis.strengthDays || [],
        devices: profile.anamnesis.devices || []
      }));
    }
  }, [profile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleToggleArray = (field: string, value: string) => {
    const current = formData[field] || [];
    const updated = current.includes(value) 
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    setFormData((prev: any) => ({ ...prev, [field]: updated }));
  };

  const onSave = async () => {
    if (!context) return;
    setIsSaving(true);
    try {
      await context.saveProfile({ anamnesis: formData });
      toast({ title: "Laboratório Atualizado", description: "Dados sincronizados com o motor de IA." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao salvar" });
    } finally {
      setIsSaving(false);
    }
  };

  const exportPDF = () => {
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      toast({ variant: "destructive", title: "Erro", description: "Aguarde o carregamento do motor de PDF." });
      return;
    }

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #000; background: #fff; width: 800px;">
        <div style="text-align: center; border-bottom: 4px solid #10b981; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 900; italic: true;">FICHA DE ANAMNESE ESPORTIVA</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">CORREJUNTO - Performance Laboratorial</p>
        </div>

        <h2 style="color: #10b981; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-size: 16px; text-transform: uppercase; font-weight: 900;">1. Identificação do Atleta</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 5px; font-weight: bold; width: 30%;">Atleta:</td><td>${profile?.name || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">WhatsApp:</td><td>${formData.whatsapp || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Profissão:</td><td>${formData.profession || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Emergência:</td><td>${formData.emergencyContact || '--'}</td></tr>
        </table>

        <h2 style="color: #10b981; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-size: 16px; text-transform: uppercase; font-weight: 900;">2. Saúde e Histórico Clínico</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 5px; font-weight: bold; width: 30%;">Liberação Médica:</td><td>${formData.medicalRelease || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Doença Crônica:</td><td>${formData.chronicIllness} ${formData.chronicIllnessDetail ? `(${formData.chronicIllnessDetail})` : ''}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Medicação:</td><td>${formData.medication || 'Nenhuma'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Lesões Antigas:</td><td>${(formData.injuryHistory || []).join(', ') || 'Nenhuma'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Dores Atuais:</td><td>${formData.activeInjuries || 'Nenhuma'}</td></tr>
        </table>

        <h2 style="color: #10b981; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-size: 16px; text-transform: uppercase; font-weight: 900;">3. Perfil Técnico de Corrida</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 5px; font-weight: bold; width: 30%;">Tempo Prática:</td><td>${formData.practiceTime || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Constância (3m):</td><td>${formData.consistency || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Paces (Z2 / Z4):</td><td>${formData.easyPace || '--'} / ${formData.hardPace || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Semana Espelho:</td><td>${formData.mirrorWeek || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Calçado:</td><td>${formData.footwear || '--'}</td></tr>
        </table>

        <h2 style="color: #10b981; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-size: 16px; text-transform: uppercase; font-weight: 900;">4. Logística e Estilo de Vida</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td style="padding: 5px; font-weight: bold; width: 30%;">Turno / Terreno:</td><td>${formData.preferredShift || '--'} / ${formData.terrain || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Monitorização:</td><td>${formData.intensityMonitoring || '--'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Força (Dias):</td><td>${(formData.strengthDays || []).join(', ') || 'Não realiza'}</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Sono / Estresse:</td><td>${formData.sleepQuality}/5 | ${formData.stressLevel}/5</td></tr>
          <tr><td style="padding: 5px; font-weight: bold;">Objetivo:</td><td>${formData.objective || '--'} (${formData.targetRace || '--'})</td></tr>
        </table>

        <div style="margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 10px; font-style: italic;">
          Relatório gerado via Cloud Sincronizada CorreJunto. Dados confidenciais.
        </div>
      </div>
    `;

    const opt = {
      margin: 0.5,
      filename: `Anamnese_${profile?.name || 'Atleta'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save();
  };

  return (
    <DashboardLayout>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
      
      <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-headline font-black uppercase italic tracking-tighter text-white">
              ANAMNESE <span className="text-primary">TÉCNICA</span>
            </h1>
            <p className="text-muted-foreground text-xs md:text-sm font-bold uppercase tracking-widest italic opacity-60">
              O cérebro biométrico da sua periodização IA
            </p>
          </div>
          <div className="flex gap-4">
             <Button 
                variant="outline" 
                onClick={exportPDF}
                className="h-14 border-primary/20 text-primary font-black uppercase italic tracking-widest rounded-2xl hover:bg-primary hover:text-black gap-2"
              >
                <FileDown size={20} /> EXPORTAR PDF
              </Button>
              <Button 
                onClick={onSave}
                disabled={isSaving}
                className="h-14 bg-primary text-black font-black uppercase italic tracking-widest rounded-2xl shadow-xl hover:bg-white gap-2 px-8"
              >
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />} SALVAR
              </Button>
          </div>
        </header>

        <div className="space-y-12">
          {/* SEÇÃO 1: IDENTIDADE E SAÚDE */}
          <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/10 p-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl uppercase italic font-black text-white">Clínica e Contato</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold italic tracking-widest">Segurança em primeiro lugar</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">WhatsApp</Label>
                 <Input 
                   value={formData.whatsapp} 
                   onChange={(e) => handleInputChange('whatsapp', e.target.value)} 
                   placeholder="(00) 00000-0000"
                   className="bg-black/30 border-border/40 h-14 font-bold rounded-xl"
                 />
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Profissão</Label>
                 <Input 
                   value={formData.profession} 
                   onChange={(e) => handleInputChange('profession', e.target.value)} 
                   className="bg-black/30 border-border/40 h-14 font-bold rounded-xl"
                 />
               </div>
               <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Liberação Médica?</Label>
                   <Select value={formData.medicalRelease} onValueChange={(v) => handleInputChange('medicalRelease', v)}>
                      <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic uppercase">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sim, recente (-1 ano)" className="font-bold italic uppercase">SIM, RECENTE</SelectItem>
                        <SelectItem value="Sim, antiga (+1 ano)" className="font-bold italic uppercase">SIM, ANTIGA</SelectItem>
                        <SelectItem value="Não possuo" className="font-bold italic uppercase">NÃO POSSUO</SelectItem>
                      </SelectContent>
                   </Select>
               </div>
               <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Doença Crônica?</Label>
                   <div className="flex gap-4">
                     <Select value={formData.chronicIllness} onValueChange={(v) => handleInputChange('chronicIllness', v)}>
                        <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic w-32 uppercase">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Não" className="font-bold italic uppercase">NÃO</SelectItem>
                          <SelectItem value="Sim" className="font-bold italic uppercase">SIM</SelectItem>
                        </SelectContent>
                     </Select>
                     <Input 
                       disabled={formData.chronicIllness !== "Sim"}
                       value={formData.chronicIllnessDetail} 
                       onChange={(e) => handleInputChange('chronicIllnessDetail', e.target.value)}
                       placeholder="Qual?"
                       className="bg-black/30 border-border/40 h-14 font-bold rounded-xl"
                     />
                   </div>
               </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 2: MECÂNICA E LESÕES */}
          <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="bg-primary/10 border-b border-border/10 p-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Activity size={24} />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl uppercase italic font-black text-white">Histórico Mecânico</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold italic tracking-widest">Ajuste de carga e proteção</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
               <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Histórico de Lesões (Já te fizeram parar?)</Label>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Canelite', 'Fascite Plantar', 'Dor Joelho', 'Aquiles', 'Nenhuma'].map(injury => (
                      <div key={injury} className="flex items-center space-x-3 bg-black/20 p-4 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer" onClick={() => handleToggleArray('injuryHistory', injury)}>
                        <Checkbox checked={formData.injuryHistory?.includes(injury)} />
                        <span className="text-[10px] font-black uppercase italic text-white/80">{injury}</span>
                      </div>
                    ))}
                 </div>
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Incômodos Atuais (Onde dói agora?)</Label>
                 <Textarea 
                   value={formData.activeInjuries} 
                   onChange={(e) => handleInputChange('activeInjuries', e.target.value)}
                   placeholder="Descreva local e frequência..."
                   className="bg-black/30 border-border/40 min-h-[100px] font-bold rounded-2xl italic"
                 />
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">"Semana Espelho" (Realidade de treino)</Label>
                    <Textarea 
                      value={formData.mirrorWeek} 
                      onChange={(e) => handleInputChange('mirrorWeek', e.target.value)}
                      placeholder="O que você realmente treinou na última semana?"
                      className="bg-black/30 border-border/40 min-h-[100px] font-bold rounded-2xl italic"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Calçado Principal (Marca/Modelo)</Label>
                    <Input 
                      value={formData.footwear} 
                      onChange={(e) => handleInputChange('footwear', e.target.value)}
                      placeholder="Ex: Corre 3, Pegasus..."
                      className="bg-black/30 border-border/40 h-14 font-bold rounded-xl"
                    />
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 3: LOGÍSTICA E VIDA */}
          <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="bg-orange-500/10 border-b border-border/10 p-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Clock size={24} />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl uppercase italic font-black text-white">Logística e Esforço</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold italic tracking-widest">Monitorização e rotina</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Monitorização</Label>
                    <Select value={formData.intensityMonitoring} onValueChange={(v) => handleInputChange('intensityMonitoring', v)}>
                        <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic uppercase">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pace" className="font-bold italic uppercase">POR PACE</SelectItem>
                          <SelectItem value="FC" className="font-bold italic uppercase">FREQUÊNCIA CARDÍACA</SelectItem>
                          <SelectItem value="RPE" className="font-bold italic uppercase">PERCEPÇÃO DE ESFORÇO</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Terreno Principal</Label>
                    <Select value={formData.terrain} onValueChange={(v) => handleInputChange('terrain', v)}>
                        <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic uppercase">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asfalto" className="font-bold italic uppercase">ASFALTO / CIDADE</SelectItem>
                          <SelectItem value="Esteira" className="font-bold italic uppercase">ESTEIRA</SelectItem>
                          <SelectItem value="Trilha" className="font-bold italic uppercase">TERRA / TRILHAS</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Turno Preferido</Label>
                    <Select value={formData.preferredShift} onValueChange={(v) => handleInputChange('preferredShift', v)}>
                        <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic uppercase">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Manhã" className="font-bold italic uppercase">MANHÃ</SelectItem>
                          <SelectItem value="Tarde" className="font-bold italic uppercase">TARDE</SelectItem>
                          <SelectItem value="Noite" className="font-bold italic uppercase">NOITE</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Dias de Treino de Força (Musculação)</Label>
                 <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleToggleArray('strengthDays', day.id)}
                        className={cn(
                          "flex-1 min-w-[70px] h-12 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group",
                          (formData.strengthDays || []).includes(day.id)
                            ? "border-purple-500 bg-purple-500/10 text-purple-400"
                            : "border-border/40 bg-black/20 text-muted-foreground hover:border-purple-500/50"
                        )}
                      >
                        <span className="text-[9px] font-black italic uppercase">{day.id}</span>
                      </button>
                    ))}
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="space-y-3 text-center">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Sono (1-5)</Label>
                   <div className="flex justify-center gap-2 mt-2">
                     {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => handleInputChange('sleepQuality', n)} className={cn("size-8 rounded-full font-black text-xs transition-all", formData.sleepQuality === n ? "bg-primary text-black scale-110" : "bg-black/30 text-white/30 border border-white/5")}>{n}</button>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-3 text-center">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Estresse (1-5)</Label>
                   <div className="flex justify-center gap-2 mt-2">
                     {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => handleInputChange('stressLevel', n)} className={cn("size-8 rounded-full font-black text-xs transition-all", formData.stressLevel === n ? "bg-rose-500 text-black scale-110" : "bg-black/30 text-white/30 border border-white/5")}>{n}</button>
                     ))}
                   </div>
                 </div>
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Comprometimento (1-10)</Label>
                   <Input 
                      type="number" 
                      min="1" max="10" 
                      value={formData.commitmentLevel} 
                      onChange={(e) => handleInputChange('commitmentLevel', parseInt(e.target.value))}
                      className="bg-black/30 border-border/40 h-10 text-center font-bold rounded-xl"
                   />
                 </div>
               </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 4: OBJETIVOS */}
          <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="bg-primary/10 border-b border-border/10 p-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Trophy size={24} />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl uppercase italic font-black text-white">Objetivo de Elite</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold italic tracking-widest">A linha de chegada</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Qual o seu objetivo hoje?</Label>
                  <Select value={formData.objective} onValueChange={(v) => handleInputChange('objective', v)}>
                      <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic uppercase">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Emagrecimento" className="font-bold italic uppercase">EMAGRECIMENTO</SelectItem>
                        <SelectItem value="Condicionamento" className="font-bold italic uppercase">CONDICIONAMENTO E SAÚDE</SelectItem>
                        <SelectItem value="Completar" className="font-bold italic uppercase">COMPLETAR UMA PROVA</SelectItem>
                        <SelectItem value="Performance" className="font-bold italic uppercase">PERFORMANCE / TEMPO</SelectItem>
                      </SelectContent>
                  </Select>
               </div>
               <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Prova Alvo / Distância Desejada</Label>
                  <Input 
                    value={formData.targetRace} 
                    onChange={(e) => handleInputChange('targetRace', e.target.value)} 
                    placeholder="Ex: Meia Maratona de SP"
                    className="bg-black/30 border-border/40 h-14 font-bold rounded-xl"
                  />
               </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="p-10 border-2 border-dashed border-primary/20 rounded-[2.5rem] bg-primary/5 text-center space-y-6">
           <Zap className="size-12 text-primary mx-auto animate-pulse" />
           <p className="text-sm font-bold italic text-muted-foreground max-w-lg mx-auto uppercase tracking-tighter">
             "ESTES DADOS ALIMENTAM O MOTOR DE IA PARA QUE SEU CICLO SEJA TÃO ÚNICO QUANTO SUA BIOMETRIA."
           </p>
           <Button 
            onClick={onSave}
            disabled={isSaving}
            className="bg-white text-black font-black uppercase italic tracking-[0.2em] px-12 h-16 rounded-2xl shadow-2xl hover:bg-primary transition-all"
           >
             {isSaving ? <Loader2 className="animate-spin mr-3" /> : null} SINCRONIZAR ANAMNESE AGORA
           </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
