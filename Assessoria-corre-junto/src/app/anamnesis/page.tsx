"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  FileDown, 
  Stethoscope, 
  Activity, 
  Clock, 
  Save,
  Loader2,
  Zap,
  Upload,
  FileDigit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, fileToDataURI } from "@/lib/utils";
import Script from "next/script";

const weekDays = [
  { id: 'Dom', label: 'Domingo' },
  { id: 'Seg', label: 'Segunda' },
  { id: 'Ter', label: 'Terça' },
  { id: 'Qua', label: 'Quarta' },
  { id: 'Qui', label: 'Quinta' },
  { id: 'Sex', label: 'Sexta' },
  { id: 'Sab', label: 'Sábado' },
];

const injuryOptions = ['Canelite', 'Fascite Plantar', 'Dor Joelho', 'Aquiles', 'Outros', 'Nenhuma'];

export default function AnamnesisPage() {
  const context = React.useContext(TrainingContext);
  const { toast } = useToast();
  const profile = context?.activeProfile;
  const [isSaving, setIsSaving] = React.useState(false);
  const mirrorWeekFileRef = React.useRef<HTMLInputElement>(null);

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
    mirrorWeekFileUri: "",
    footwear: "",
    preferredShift: "",
    strengthDays: [],
    intensityMonitoring: "",
    terrain: "",
    devices: [],
    biggestDifficulty: "",
    commitmentLevel: 10,
    sleepQuality: 3,
    stressLevel: 3,
    objective: "",
    targetRace: ""
  });

  React.useEffect(() => {
    if (profile) {
      setFormData((prev: any) => ({
        ...prev,
        ...profile.anamnesis,
        objective: profile.anamnesis?.objective || (profile.raceDistance ? `Completar ${profile.raceDistance}` : ""),
        targetRace: profile.anamnesis?.targetRace || profile.raceName || "",
        strengthDays: profile.anamnesis?.strengthDays || [],
        injuryHistory: profile.anamnesis?.injuryHistory || [],
        devices: profile.anamnesis?.devices || []
      }));
    }
  }, [profile?.id]);

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

  const handleMirrorFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uri = await fileToDataURI(e.target.files[0]);
      handleInputChange('mirrorWeekFileUri', uri);
      toast({ title: "Arquivo Carregado", description: "O Gemini Coach analisará seus treinos reais." });
    }
  };

  const onSave = async () => {
    if (!context) return;
    setIsSaving(true);
    try {
      await context.saveProfile({ 
        anamnesis: formData,
        raceName: formData.targetRace || profile?.raceName,
      });
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
        </table>
        <div style="margin-top: 50px; font-size: 10px; color: #9ca3af; text-align: center; border-top: 1px solid #f3f4f6; padding-top: 10px; font-style: italic;">
          Relatório gerado via Cloud Sincronizada CorreJunto.
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
      
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-10 animate-in fade-in duration-700 pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
          <div className="space-y-1 md:space-y-2">
            <h1 className="text-3xl md:text-5xl font-headline font-black uppercase italic tracking-tighter text-white">
              ANAMNESE <span className="text-primary">TÉCNICA</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Button 
                variant="outline" 
                onClick={exportPDF}
                className="h-12 border-primary/20 text-primary font-black uppercase italic text-[11px] tracking-widest rounded-2xl hover:bg-primary hover:text-black gap-2 w-full sm:w-auto"
              >
                <FileDown size={18} /> EXPORTAR PDF
              </Button>
              <Button 
                onClick={onSave}
                disabled={isSaving}
                className="h-12 bg-primary text-black font-black uppercase italic text-[11px] tracking-widest rounded-2xl shadow-xl hover:bg-white gap-2 px-8 w-full sm:w-auto"
              >
                {isSaving ? <Loader2 className="animate-spin size-4" /> : <Save size={18} />} SALVAR
              </Button>
          </div>
        </header>

        <div className="space-y-10 md:space-y-12">
          <Card className="bg-card/40 border-border/50 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl">
            <CardHeader className="bg-secondary/10 border-b border-border/10 p-6 md:p-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <CardTitle className="font-headline text-lg md:text-xl uppercase italic font-black text-white">Clínica e Contato</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">WhatsApp</Label>
                 <Input 
                   value={formData.whatsapp || ""} 
                   onChange={(e) => handleInputChange('whatsapp', e.target.value)} 
                   className="bg-black/30 border-border/40 h-11 font-bold rounded-xl text-xs"
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Profissão</Label>
                 <Input 
                   value={formData.profession || ""} 
                   onChange={(e) => handleInputChange('profession', e.target.value)} 
                   className="bg-black/30 border-border/40 h-11 font-bold rounded-xl text-xs"
                 />
               </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl">
            <CardHeader className="bg-primary/10 border-b border-border/10 p-6 md:p-8">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="size-10 md:size-12 rounded-xl md:rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Activity size={20} />
                </div>
                <div>
                  <CardTitle className="font-headline text-lg md:text-xl uppercase italic font-black text-white">Histórico Mecânico</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 md:p-10 space-y-8 md:space-y-10">
               <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase italic text-muted-foreground tracking-widest">Lesões Anteriores</Label>
                 <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {injuryOptions.map(injury => (
                      <div key={injury} className="flex items-center space-x-2 bg-black/20 p-3 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-pointer" onClick={() => handleToggleArray('injuryHistory', injury)}>
                        <Checkbox checked={(formData.injuryHistory || []).includes(injury)} className="size-4" />
                        <span className="text-[10px] font-black uppercase italic text-white/80">{injury}</span>
                      </div>
                    ))}
                 </div>
               </div>

               <div className="pt-6 border-t border-white/5 space-y-6">
                 <div className="flex items-center gap-2">
                    <Clock className="text-primary size-4" />
                    <Label className="text-[10px] font-black uppercase italic text-white tracking-widest">"Semana Espelho" (Relato e/ou Arquivo)</Label>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-[8px] font-black uppercase text-muted-foreground/60 italic">RELATO TÉCNICO</Label>
                      <Textarea 
                        value={formData.mirrorWeek || ""} 
                        onChange={(e) => handleInputChange('mirrorWeek', e.target.value)}
                        placeholder="Ex: Corri 30km em 3 treinos, pace médio 5:30..."
                        className="bg-black/30 border-border/40 min-h-[120px] font-bold rounded-xl italic text-xs"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[8px] font-black uppercase text-muted-foreground/60 italic">ARQUIVO DE TREINO (.FIT, .JPG, .PDF)</Label>
                      <div 
                        onClick={() => mirrorWeekFileRef.current?.click()}
                        className={cn(
                          "border-2 border-dashed rounded-xl h-[120px] flex flex-col items-center justify-center transition-all cursor-pointer",
                          formData.mirrorWeekFileUri ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/50"
                        )}
                      >
                         <input type="file" ref={mirrorWeekFileRef} className="sr-only" onChange={handleMirrorFileChange} accept="image/*,.fit,.csv,.pdf" />
                         {formData.mirrorWeekFileUri ? (
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-primary text-black rounded-lg"><FileDigit size={20}/></div>
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase text-primary italic">Documento Pronto</p>
                                <Button variant="ghost" size="sm" className="h-6 p-0 text-[7px] text-muted-foreground hover:text-rose-500" onClick={(e) => { e.stopPropagation(); handleInputChange('mirrorWeekFileUri', ''); }}>REMOVER</Button>
                              </div>
                           </div>
                         ) : (
                           <div className="text-center space-y-2">
                              <Upload className="size-6 text-muted-foreground/40 mx-auto" />
                              <p className="text-[8px] font-bold uppercase italic text-muted-foreground/40">Upload de Treinos</p>
                           </div>
                         )}
                      </div>
                    </div>
                 </div>
               </div>
            </CardContent>
          </Card>

          <div className="p-6 md:p-10 border-2 border-dashed border-primary/20 rounded-[1.5rem] md:rounded-[2.5rem] bg-primary/5 text-center space-y-6">
             <Zap className="size-8 md:size-12 text-primary mx-auto animate-pulse" />
             <p className="text-[10px] md:text-sm font-bold italic text-muted-foreground max-w-lg mx-auto uppercase tracking-tighter">
               "ESTES DADOS ALIMENTAM O MOTOR DE IA PARA QUE SEU CICLO SEJA TÃO ÚNICO QUANTO SUA BIOMETRIA."
             </p>
             <Button 
              onClick={onSave}
              disabled={isSaving}
              className="bg-white text-black font-black uppercase italic tracking-[0.2em] px-8 md:px-12 h-14 md:h-16 rounded-xl md:rounded-2xl shadow-2xl text-[10px] md:text-sm w-full sm:w-auto"
             >
               {isSaving ? <Loader2 className="animate-spin mr-3 size-4" /> : null} SINCRONIZAR LABORATÓRIO AGORA
             </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
