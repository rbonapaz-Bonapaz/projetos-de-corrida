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
  Loader2
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
    diasCorrida: [],
    diaLongao: "",
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
    dietClassification: ""
  });

  React.useEffect(() => {
    if (profile?.anamnesis) {
      setFormData((prev: any) => ({
        ...prev,
        ...profile.anamnesis,
        injuryHistory: profile.anamnesis.injuryHistory || [],
        diasCorrida: profile.anamnesis.diasCorrida || [],
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
      toast({ title: "Anamnese Salva", description: "Seus dados biometrizados estão seguros na nuvem." });
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao salvar" });
    } finally {
      setIsSaving(false);
    }
  };

  const exportPDF = () => {
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) {
      toast({ variant: "destructive", title: "Erro", description: "O motor de PDF ainda não carregou. Aguarde um instante." });
      return;
    }

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 40px; color: #000; background: #fff; width: 800px;">
        <div style="text-align: center; border-bottom: 4px solid #4ade80; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #10b981; margin: 0; font-size: 28px; text-transform: uppercase;">FICHA DE ANAMNESE ESPORTIVA</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-weight: bold;">Plataforma CORREJUNTO - Performance Laboratorial</p>
        </div>

        <h2 style="color: #10b981; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-size: 18px; text-transform: uppercase;">1. Identificação do Atleta</h2>
        <p><strong>Nome:</strong> ${profile?.name || 'Não informado'}</p>
        <p><strong>WhatsApp:</strong> ${formData.whatsapp || '--'}</p>
        <p><strong>Profissão:</strong> ${formData.profession || '--'}</p>
        <p><strong>Emergência:</strong> ${formData.emergencyContact || '--'}</p>

        <h2 style="color: #10b981; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-size: 18px; margin-top: 25px; text-transform: uppercase;">2. Saúde e Histórico Clínico</h2>
        <p><strong>Liberação Médica:</strong> ${formData.medicalRelease || '--'}</p>
        <p><strong>Doença Crônica:</strong> ${formData.chronicIllness} ${formData.chronicIllnessDetail ? `(${formData.chronicIllnessDetail})` : ''}</p>
        <p><strong>Medicação:</strong> ${formData.medication || 'Nenhuma'}</p>
        <p><strong>Histórico de Lesões:</strong> ${(formData.injuryHistory || []).join(', ') || 'Nenhuma'}</p>
        <p><strong>Dores Atuais:</strong> ${formData.activeInjuries || 'Nenhuma'}</p>

        <h2 style="color: #10b981; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-size: 18px; margin-top: 25px; text-transform: uppercase;">3. Perfil de Corrida</h2>
        <p><strong>Tempo de Prática:</strong> ${formData.practiceTime || '--'}</p>
        <p><strong>Volume/Constância:</strong> ${formData.consistency || '--'}</p>
        <p><strong>Paces (Z2 / Z4):</strong> ${formData.easyPace || '--'} / ${formData.hardPace || '--'}</p>
        <p><strong>Calçado:</strong> ${formData.footwear || '--'}</p>
        <p><strong>Recorde Recente:</strong> ${formData.recentRecord || '--'}</p>

        <h2 style="color: #10b981; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; font-size: 18px; margin-top: 25px; text-transform: uppercase;">4. Logística e Estilo de Vida</h2>
        <p><strong>Dias Disponíveis:</strong> ${(formData.diasCorrida || []).join(', ') || '--'}</p>
        <p><strong>Monitorização:</strong> ${formData.intensityMonitoring || '--'}</p>
        <p><strong>Sono / Estresse:</strong> Nível ${formData.sleepQuality}/5 | Nível ${formData.stressLevel}/5</p>
        <p><strong>Objetivo:</strong> ${formData.biggestDifficulty || '--'}</p>

        <div style="margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 10px;">
          Relatório gerado automaticamente pela Inteligência Artificial do CorreJunto.
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
              Análise profunda para prescrição de alta performance
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
          {/* SEÇÃO 1: DADOS PESSOAIS */}
          <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="bg-secondary/10 border-b border-border/10 p-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                  <ClipboardList size={24} />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl uppercase italic font-black text-white">Identidade e Contato</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold italic tracking-widest">Base de registro do laboratório</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">WhatsApp / Celular</Label>
                 <Input 
                   value={formData.whatsapp} 
                   onChange={(e) => handleInputChange('whatsapp', e.target.value)} 
                   placeholder="(00) 00000-0000"
                   className="bg-black/30 border-border/40 h-14 font-bold rounded-xl focus:border-primary"
                 />
               </div>
               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Profissão</Label>
                 <Input 
                   value={formData.profession} 
                   onChange={(e) => handleInputChange('profession', e.target.value)} 
                   className="bg-black/30 border-border/40 h-14 font-bold rounded-xl focus:border-primary"
                 />
               </div>
               <div className="md:col-span-2 space-y-3">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Contato de Emergência (Nome e Tel)</Label>
                 <Input 
                   value={formData.emergencyContact} 
                   onChange={(e) => handleInputChange('emergencyContact', e.target.value)} 
                   className="bg-black/30 border-border/40 h-14 font-bold rounded-xl focus:border-primary"
                 />
               </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 2: SAÚDE E LESÕES */}
          <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="bg-destructive/10 border-b border-border/10 p-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <Stethoscope size={24} />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl uppercase italic font-black text-white">Clínica e Lesões</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold italic tracking-widest">Segurança e mitigação de risco</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Liberação Médica Recente?</Label>
                   <Select value={formData.medicalRelease} onValueChange={(v) => handleInputChange('medicalRelease', v)}>
                      <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl focus:border-primary italic uppercase">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Recente (-1 ano)" className="font-bold italic uppercase">SIM, RECENTE</SelectItem>
                        <SelectItem value="Antiga (+1 ano)" className="font-bold italic uppercase">SIM, MAS ANTIGA</SelectItem>
                        <SelectItem value="Nenhuma" className="font-bold italic uppercase">NÃO POSSUO</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Doença Crônica?</Label>
                   <div className="flex gap-4">
                     <Select value={formData.chronicIllness} onValueChange={(v) => handleInputChange('chronicIllness', v)}>
                        <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl focus:border-primary italic w-32 uppercase">
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
                       placeholder="Se sim, qual?"
                       className="bg-black/30 border-border/40 h-14 font-bold rounded-xl focus:border-primary"
                     />
                   </div>
                 </div>
               </div>

               <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Histórico de Lesões Clássicas</Label>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['Canelite', 'Fascite Plantar', 'Joelho', 'Tendão Aquiles', 'Nenhuma'].map(injury => (
                      <div key={injury} className="flex items-center space-x-3 bg-black/20 p-4 rounded-xl border border-white/5 group hover:border-primary/30 transition-all cursor-pointer" onClick={() => handleToggleArray('injuryHistory', injury)}>
                        <Checkbox checked={formData.injuryHistory?.includes(injury)} />
                        <span className="text-[10px] font-black uppercase italic text-white/80 group-hover:text-primary">{injury}</span>
                      </div>
                    ))}
                 </div>
               </div>

               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Dores ou Incômodos Atuais</Label>
                 <Textarea 
                   value={formData.activeInjuries} 
                   onChange={(e) => handleInputChange('activeInjuries', e.target.value)}
                   placeholder="Descreva local, frequência e intensidade..."
                   className="bg-black/30 border-border/40 min-h-[120px] font-bold rounded-2xl focus:border-primary italic"
                 />
               </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 3: PERFIL DE CORRIDA */}
          <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="bg-primary/10 border-b border-border/10 p-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Activity size={24} />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl uppercase italic font-black text-white">Perfil e Performance</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold italic tracking-widest">Nível técnico e métricas atuais</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Tempo de Prática</Label>
                   <Select value={formData.practiceTime} onValueChange={(v) => handleInputChange('practiceTime', v)}>
                      <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic uppercase">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-3 meses" className="font-bold italic uppercase">- 3 MESES</SelectItem>
                        <SelectItem value="3-6 meses" className="font-bold italic uppercase">3 A 6 MESES</SelectItem>
                        <SelectItem value="6-12 meses" className="font-bold italic uppercase">6 MESES A 1 ANO</SelectItem>
                        <SelectItem value="+1 ano" className="font-bold italic uppercase">MAIS DE 1 ANO</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Constância nos últimos 3 meses</Label>
                   <Select value={formData.consistency} onValueChange={(v) => handleInputChange('consistency', v)}>
                      <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic uppercase">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regular" className="font-bold italic uppercase">REGULAR E CONSTANTE</SelectItem>
                        <SelectItem value="Irregular" className="font-bold italic uppercase">IRREGULAR</SelectItem>
                        <SelectItem value="Retornando" className="font-bold italic uppercase">RETORNANDO AGORA</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Pace de Trote (Z2)</Label>
                   <Input value={formData.easyPace} onChange={(e) => handleInputChange('easyPace', e.target.value)} placeholder="Ex: 6:30/km" className="bg-black/30 border-border/40 h-14 font-bold rounded-xl" />
                 </div>
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Pace Forte (Z4)</Label>
                   <Input value={formData.hardPace} onChange={(e) => handleInputChange('hardPace', e.target.value)} placeholder="Ex: 5:00/km" className="bg-black/30 border-border/40 h-14 font-bold rounded-xl" />
                 </div>
               </div>

               <div className="space-y-3">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">"Semana Espelho" (O que realmente treinou na última semana?)</Label>
                 <Textarea 
                   value={formData.mirrorWeek} 
                   onChange={(e) => handleInputChange('mirrorWeek', e.target.value)}
                   placeholder="Ex: Seg 5km, Qua Off, Sex 6km... Seja sincero(a)!"
                   className="bg-black/30 border-border/40 min-h-[100px] font-bold rounded-2xl focus:border-primary italic"
                 />
               </div>
            </CardContent>
          </Card>

          {/* SEÇÃO 4: LOGÍSTICA E VIDA */}
          <Card className="bg-card/40 border-border/50 rounded-3xl overflow-hidden shadow-2xl">
            <CardHeader className="bg-orange-500/10 border-b border-border/10 p-8">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                  <Heart size={24} />
                </div>
                <div>
                  <CardTitle className="font-headline text-xl uppercase italic font-black text-white">Logística e Vida</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold italic tracking-widest">Disponibilidade e monitoramento</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-10 space-y-10">
               <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Disponibilidade Semanal para Correr</Label>
                 <div className="flex flex-wrap gap-2">
                    {weekDays.map(day => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleToggleArray('diasCorrida', day.id)}
                        className={cn(
                          "flex-1 min-w-[70px] h-12 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 group",
                          (formData.diasCorrida || []).includes(day.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border/40 bg-black/20 text-muted-foreground hover:border-primary/50"
                        )}
                      >
                        <span className="text-[9px] font-black italic uppercase">{day.id}</span>
                      </button>
                    ))}
                 </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Monitorização de Esforço?</Label>
                   <Select value={formData.intensityMonitoring} onValueChange={(v) => handleInputChange('intensityMonitoring', v)}>
                      <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic uppercase">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pace" className="font-bold italic uppercase">POR RITMO (PACE)</SelectItem>
                        <SelectItem value="FC" className="font-bold italic uppercase">FREQUÊNCIA CARDÍACA</SelectItem>
                        <SelectItem value="RPE" className="font-bold italic uppercase">PERCEPÇÃO DE ESFORÇO</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
                 <div className="space-y-3">
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Dispositivos / Apps</Label>
                   <div className="grid grid-cols-2 gap-2">
                      {['Garmin', 'Strava', 'Coros', 'Apple', 'Nenhum'].map(dev => (
                        <div key={dev} className="flex items-center space-x-2 bg-black/20 p-3 rounded-lg border border-white/5 cursor-pointer" onClick={() => handleToggleArray('devices', dev)}>
                          <Checkbox checked={(formData.devices || []).includes(dev)} />
                          <span className="text-[9px] font-black uppercase italic text-white/60">{dev}</span>
                        </div>
                      ))}
                   </div>
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
                   <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Classificação Alimentação</Label>
                   <Select value={formData.dietClassification} onValueChange={(v) => handleInputChange('dietClassification', v)}>
                      <SelectTrigger className="bg-black/30 border-border/40 h-14 font-bold rounded-xl italic uppercase">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Regrada" className="font-bold italic uppercase">MUITO REGRADA</SelectItem>
                        <SelectItem value="Equilibrada" className="font-bold italic uppercase">EQUILIBRADA</SelectItem>
                        <SelectItem value="Desorganizada" className="font-bold italic uppercase">DESORGANIZADA</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
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
