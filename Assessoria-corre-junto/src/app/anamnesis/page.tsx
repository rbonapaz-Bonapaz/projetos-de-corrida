"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
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
      toast({ title: "Arquivo carregado", description: "O Coach IA vai considerar seus treinos reais." });
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
      toast({ title: "Anamnese atualizada", description: "Dados sincronizados com o motor de IA." });
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
          <h1 style="color: #10b981; margin: 0; font-size: 28px; text-transform: uppercase; font-weight: 900;">FICHA DE ANAMNESE ESPORTIVA</h1>
          <p style="margin: 5px 0 0 0; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">CORREJUNTO</p>
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

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-[26px] font-bold tracking-tight flex items-center gap-2.5">
            <Stethoscope className="size-6 text-primary" /> Anamnese técnica
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Triagem de saúde e histórico de lesões — usada pela IA para prescrever com segurança.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
          <Button variant="outline" onClick={exportPDF} className="rounded-xl gap-2">
            <FileDown size={16} /> Exportar PDF
          </Button>
          <Button onClick={onSave} disabled={isSaving} className="rounded-xl gap-2">
            {isSaving ? <Loader2 className="animate-spin size-4" /> : <Save size={16} />} Salvar
          </Button>
        </div>
      </header>

      <div className="flex flex-col gap-5">
        <section className="card-plain">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
              <Stethoscope size={18} />
            </div>
            <h3 className="font-bold text-[15px]">Clínica e contato</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="eyebrow">WhatsApp</Label>
              <Input
                value={formData.whatsapp || ""}
                onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Profissão</Label>
              <Input
                value={formData.profession || ""}
                onChange={(e) => handleInputChange('profession', e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>
          </div>
        </section>

        <section className="card-plain">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Activity size={18} />
            </div>
            <h3 className="font-bold text-[15px]">Histórico mecânico</h3>
          </div>

          <div className="space-y-3">
            <Label className="eyebrow">Lesões anteriores</Label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
              {injuryOptions.map(injury => (
                <div
                  key={injury}
                  className="flex items-center gap-2.5 bg-secondary/40 p-2.5 rounded-lg border border-border hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => handleToggleArray('injuryHistory', injury)}
                >
                  <Checkbox checked={(formData.injuryHistory || []).includes(injury)} className="size-4" />
                  <span className="text-[12px] font-medium">{injury}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-5 mt-5 border-t border-border space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="text-primary size-4" />
              <Label className="eyebrow !text-foreground">Semana espelho (relato e/ou arquivo)</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <Label className="eyebrow">Relato técnico</Label>
                <Textarea
                  value={formData.mirrorWeek || ""}
                  onChange={(e) => handleInputChange('mirrorWeek', e.target.value)}
                  placeholder="Ex: Corri 30km em 3 treinos, pace médio 5:30..."
                  className="min-h-[110px] rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="eyebrow">Arquivo de treino (.fit, .jpg, .pdf)</Label>
                <div
                  onClick={() => mirrorWeekFileRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl h-[110px] flex flex-col items-center justify-center transition-all cursor-pointer",
                    formData.mirrorWeekFileUri ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/30"
                  )}
                >
                  <input type="file" ref={mirrorWeekFileRef} className="sr-only" onChange={handleMirrorFileChange} accept="image/*,.fit,.csv,.pdf" />
                  {formData.mirrorWeekFileUri ? (
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-primary text-primary-foreground rounded-lg"><FileDigit size={18} /></div>
                      <div className="text-left">
                        <p className="text-[11px] font-semibold text-primary">Documento pronto</p>
                        <Button variant="ghost" size="sm" className="h-6 p-0 text-[10px] text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); handleInputChange('mirrorWeekFileUri', ''); }}>Remover</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-1.5">
                      <Upload className="size-5 text-muted-foreground/50 mx-auto" />
                      <p className="text-[11px] text-muted-foreground">Upload de treinos</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="card-plain text-center space-y-4" style={{ background: "hsl(var(--accent-soft))" }}>
          <Zap className="size-8 text-primary mx-auto" />
          <p className="text-[13px] text-foreground/80 max-w-lg mx-auto">
            Estes dados alimentam o motor de IA para que seu ciclo seja tão único quanto sua biometria.
          </p>
          <Button onClick={onSave} disabled={isSaving} className="rounded-xl h-11 px-8">
            {isSaving ? <Loader2 className="animate-spin mr-2 size-4" /> : null} Sincronizar agora
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
