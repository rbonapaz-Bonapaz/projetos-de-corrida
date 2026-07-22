"use client";

import * as React from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TrainingContext } from "@/contexts/TrainingContext";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  FileDown,
  Stethoscope,
  Activity,
  Clock,
  Save,
  Loader2,
  Zap,
  Upload,
  FileDigit,
  Target,
  Dumbbell,
  Apple,
  Moon,
  Gauge
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn, fileToDataURI } from "@/lib/utils";
import Script from "next/script";

const injuryOptions = ['Canelite', 'Fascite Plantar', 'Dor Joelho', 'Aquiles', 'Outros', 'Nenhuma'];
const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const deviceOptions = ['Relógio GPS', 'Faixa cardíaca', 'App no celular', 'Nenhum'];
const terrainOptions = ['Asfalto', 'Trilha', 'Esteira', 'Pista', 'Misto'];
const practiceTimeOptions = ['Menos de 6 meses', '6 meses a 1 ano', '1 a 3 anos', 'Mais de 3 anos'];
const consistencyOptions = ['Irregular', 'Moderada', 'Consistente'];
const shiftOptions = ['Manhã', 'Tarde', 'Noite', 'Variável'];
const intensityOptions = ['Frequência cardíaca', 'Pace', 'Percepção de esforço (PSE)', 'Não monitoro'];
const dietOptions = ['Disciplinada', 'Moderada', 'Irregular', 'Não faço dieta'];

function PillGroup({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "px-3 py-2 rounded-lg text-[12px] font-medium border transition-all",
            value === opt
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function TagToggle({ values, options, onToggle }: { values: string[]; options: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={cn(
            "px-3 py-2 rounded-lg text-[12px] font-medium border transition-all",
            values.includes(opt)
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/40 border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

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
        {/* OBJETIVO */}
        <section className="card-plain">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Target size={18} />
            </div>
            <h3 className="font-bold text-[15px]">Objetivo</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="eyebrow">Objetivo principal</Label>
              <Input
                value={formData.objective || ""}
                onChange={(e) => handleInputChange('objective', e.target.value)}
                placeholder="Ex: Completar minha primeira meia maratona"
                className="h-11 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Prova-alvo</Label>
              <Input
                value={formData.targetRace || ""}
                onChange={(e) => handleInputChange('targetRace', e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>
          </div>
        </section>

        {/* CLÍNICA E CONTATO */}
        <section className="card-plain">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive shrink-0">
              <Stethoscope size={18} />
            </div>
            <h3 className="font-bold text-[15px]">Clínica e contato</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            <div className="space-y-1.5">
              <Label className="eyebrow">Contato de emergência</Label>
              <Input
                value={formData.emergencyContact || ""}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Nome e telefone"
                className="h-11 rounded-xl text-sm"
              />
            </div>
          </div>
        </section>

        {/* SAÚDE */}
        <section className="card-plain">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-400 shrink-0">
              <Activity size={18} />
            </div>
            <h3 className="font-bold text-[15px]">Saúde</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="eyebrow">Liberação médica para correr</Label>
              <PillGroup
                value={formData.medicalRelease}
                options={['Sim', 'Não', 'Parcial (com restrições)']}
                onChange={(v) => handleInputChange('medicalRelease', v)}
              />
            </div>
            <div className="space-y-2">
              <Label className="eyebrow">Possui doença crônica?</Label>
              <PillGroup
                value={formData.chronicIllness}
                options={['Sim', 'Não']}
                onChange={(v) => handleInputChange('chronicIllness', v)}
              />
            </div>
          </div>

          {formData.chronicIllness === 'Sim' && (
            <div className="space-y-1.5 mt-4">
              <Label className="eyebrow">Qual(is)?</Label>
              <Input
                value={formData.chronicIllnessDetail || ""}
                onChange={(e) => handleInputChange('chronicIllnessDetail', e.target.value)}
                className="h-11 rounded-xl text-sm"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            <div className="space-y-1.5">
              <Label className="eyebrow">Medicação em uso</Label>
              <Input
                value={formData.medication || ""}
                onChange={(e) => handleInputChange('medication', e.target.value)}
                placeholder="Se nenhuma, deixe em branco"
                className="h-11 rounded-xl text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Dores/lesões ativas agora</Label>
              <Input
                value={formData.activeInjuries || ""}
                onChange={(e) => handleInputChange('activeInjuries', e.target.value)}
                placeholder="Se nenhuma, deixe em branco"
                className="h-11 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5 pt-5 border-t border-border">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="eyebrow flex items-center gap-1.5"><Moon size={11} /> Qualidade do sono</Label>
                <span className="num text-[12px] font-semibold text-primary">{formData.sleepQuality}/5</span>
              </div>
              <Slider value={[formData.sleepQuality]} min={1} max={5} step={1} onValueChange={([v]) => handleInputChange('sleepQuality', v)} />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="eyebrow flex items-center gap-1.5"><Gauge size={11} /> Nível de estresse</Label>
                <span className="num text-[12px] font-semibold text-primary">{formData.stressLevel}/5</span>
              </div>
              <Slider value={[formData.stressLevel]} min={1} max={5} step={1} onValueChange={([v]) => handleInputChange('stressLevel', v)} />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label className="eyebrow">Comprometimento</Label>
                <span className="num text-[12px] font-semibold text-primary">{formData.commitmentLevel}/10</span>
              </div>
              <Slider value={[formData.commitmentLevel]} min={0} max={10} step={1} onValueChange={([v]) => handleInputChange('commitmentLevel', v)} />
            </div>
          </div>
        </section>

        {/* HISTÓRICO MECÂNICO */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5 pt-5 border-t border-border">
            <div className="space-y-2">
              <Label className="eyebrow">Tempo de prática</Label>
              <PillGroup value={formData.practiceTime} options={practiceTimeOptions} onChange={(v) => handleInputChange('practiceTime', v)} />
            </div>
            <div className="space-y-2">
              <Label className="eyebrow">Consistência nos treinos</Label>
              <PillGroup value={formData.consistency} options={consistencyOptions} onChange={(v) => handleInputChange('consistency', v)} />
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

        {/* ROTINA DE TREINO */}
        <section className="card-plain">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
              <Gauge size={18} />
            </div>
            <h3 className="font-bold text-[15px]">Rotina de treino</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label className="eyebrow">Pace fácil atual</Label>
              <Input value={formData.easyPace || ""} onChange={(e) => handleInputChange('easyPace', e.target.value)} placeholder="Ex: 6:30/km" className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Pace forte atual</Label>
              <Input value={formData.hardPace || ""} onChange={(e) => handleInputChange('hardPace', e.target.value)} placeholder="Ex: 5:00/km" className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Melhor marca recente</Label>
              <Input value={formData.recentRecord || ""} onChange={(e) => handleInputChange('recentRecord', e.target.value)} placeholder="Ex: 10km em 48min" className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Maior distância contínua já percorrida</Label>
              <Input value={formData.maxContinuousDistance || ""} onChange={(e) => handleInputChange('maxContinuousDistance', e.target.value)} placeholder="Ex: 15 km" className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Tempo disponível — dias de semana</Label>
              <Input value={formData.timeWeekdays || ""} onChange={(e) => handleInputChange('timeWeekdays', e.target.value)} placeholder="Ex: até 1h por dia" className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Tempo disponível — fins de semana</Label>
              <Input value={formData.timeWeekends || ""} onChange={(e) => handleInputChange('timeWeekends', e.target.value)} placeholder="Ex: até 2h30" className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Calçado utilizado</Label>
              <Input value={formData.footwear || ""} onChange={(e) => handleInputChange('footwear', e.target.value)} placeholder="Modelo e idade aproximada" className="h-11 rounded-xl text-sm" />
            </div>
          </div>

          <div className="space-y-1.5 mt-5">
            <Label className="eyebrow">Como estrutura os treinos hoje</Label>
            <Textarea
              value={formData.trainingStructure || ""}
              onChange={(e) => handleInputChange('trainingStructure', e.target.value)}
              placeholder="Ex: treino sozinho, sigo planilha de app, corro livre..."
              className="min-h-[90px] rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5 pt-5 border-t border-border">
            <div className="space-y-2">
              <Label className="eyebrow">Turno preferido</Label>
              <PillGroup value={formData.preferredShift} options={shiftOptions} onChange={(v) => handleInputChange('preferredShift', v)} />
            </div>
            <div className="space-y-2">
              <Label className="eyebrow">Terreno habitual</Label>
              <PillGroup value={formData.terrain} options={terrainOptions} onChange={(v) => handleInputChange('terrain', v)} />
            </div>
            <div className="space-y-2">
              <Label className="eyebrow">Como monitora intensidade</Label>
              <PillGroup value={formData.intensityMonitoring} options={intensityOptions} onChange={(v) => handleInputChange('intensityMonitoring', v)} />
            </div>
            <div className="space-y-2">
              <Label className="eyebrow">Dispositivos que utiliza</Label>
              <TagToggle values={formData.devices || []} options={deviceOptions} onToggle={(v) => handleToggleArray('devices', v)} />
            </div>
          </div>

          <div className="space-y-1.5 mt-5">
            <Label className="eyebrow">Maior dificuldade hoje</Label>
            <Textarea
              value={formData.biggestDifficulty || ""}
              onChange={(e) => handleInputChange('biggestDifficulty', e.target.value)}
              placeholder="Ex: falta de tempo, dor recorrente, motivação..."
              className="min-h-[90px] rounded-xl text-sm"
            />
          </div>
        </section>

        {/* FORÇA */}
        <section className="card-plain">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0">
              <Dumbbell size={18} />
            </div>
            <h3 className="font-bold text-[15px]">Força</h3>
          </div>

          <div className="space-y-2">
            <Label className="eyebrow">Dias disponíveis para musculação</Label>
            <TagToggle values={formData.strengthDays || []} options={weekDays} onToggle={(v) => handleToggleArray('strengthDays', v)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
            <div className="space-y-1.5">
              <Label className="eyebrow">Foco da musculação</Label>
              <Input value={formData.strengthFocus || ""} onChange={(e) => handleInputChange('strengthFocus', e.target.value)} placeholder="Ex: força, hipertrofia, estabilidade" className="h-11 rounded-xl text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="eyebrow">Onde treina força</Label>
              <Input value={formData.strengthLocation || ""} onChange={(e) => handleInputChange('strengthLocation', e.target.value)} placeholder="Academia, casa, ar livre..." className="h-11 rounded-xl text-sm" />
            </div>
          </div>
        </section>

        {/* ALIMENTAÇÃO */}
        <section className="card-plain">
          <div className="flex items-center gap-3 mb-5">
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
              <Apple size={18} />
            </div>
            <h3 className="font-bold text-[15px]">Alimentação</h3>
          </div>
          <div className="space-y-2">
            <Label className="eyebrow">Como classifica sua alimentação hoje</Label>
            <PillGroup value={formData.dietClassification} options={dietOptions} onChange={(v) => handleInputChange('dietClassification', v)} />
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
