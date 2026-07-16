"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import {
  User, Car, Building, Truck, ArrowLeft, Check, ChevronRight,
  Globe, Shield, Camera, FileText, Smartphone, Loader2,
  MapPin, Clock, Image as ImageIcon, Briefcase,
} from "lucide-react";
import Link from "next/link";
import { CountrySelector } from "@/lib/components/country-selector";
import { DocumentUpload } from "@/lib/components/document-upload";
import { SelfieCapture } from "@/lib/components/selfie-capture";
import { COUNTRIES, type Country, type DocumentType } from "@/lib/auth/countries";
import { validateCPF, validateCNPJ } from "@/lib/auth/cpf-validator";
import { validatePassport } from "@/lib/auth/passport-validator";
import { signUp, getDashboardRoute, type Role } from "@/lib/auth/auth-service";

type ProfileType = "passenger" | "driver" | "company" | "transporter";

const VEHICLE_CATEGORIES = [
  { id: "moto", label: "Moto" },
  { id: "carro", label: "Carro" },
  { id: "suv", label: "SUV" },
  { id: "van", label: "Van" },
  { id: "caminhonete", label: "Caminhonete" },
  { id: "caminhao", label: "Caminhão" },
  { id: "carreta", label: "Carreta" },
];

function getStepLabels(type: ProfileType): string[] {
  if (type === "passenger") return ["Perfil", "País", "Selfie", "Dados", "Pronto"];
  return ["Perfil", "País", "Documentos", "Selfie", "Dados", "Pronto"];
}

function getStepCount(type: ProfileType): number {
  return type === "passenger" ? 5 : 6;
}

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialType = searchParams.get("type") as ProfileType | null;

  const [profileType, setProfileType] = useState<ProfileType>(initialType || "passenger");
  const [step, setStep] = useState(initialType ? 2 : 1);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [selectedDoc, setSelectedDoc] = useState<string>("");
  const [docUploaded, setDocUploaded] = useState<Record<string, boolean>>({});
  const [docFile, setDocFile] = useState<Record<string, File>>({});
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [companyPhotoBlob, setCompanyPhotoBlob] = useState<Blob | null>(null);
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", password: "", document: "",
    cpf: "", cnpj: "", birthDate: "",
    vehicleModel: "", vehiclePlate: "", vehicleBrand: "",
    vehicleColor: "", vehicleYear: "", vehicleCategory: "carro",
    corporateName: "", tradeName: "", companyAddress: "",
    openingHours: "", serviceDescription: "", responsibleName: "",
  });
  const [validating, setValidating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stepLabels = getStepLabels(profileType);
  const totalSteps = getStepCount(profileType);

  useEffect(() => {
    if (step === totalSteps) {
      router.replace(getDashboardRoute(profileType as Role));
    }
  }, [step, totalSteps, profileType, router]);

  const nextStep = useCallback(() => setStep(s => Math.min(s + 1, totalSteps)), [totalSteps]);

  const handleProfileSelect = (type: ProfileType) => {
    setProfileType(type);
    setStep(2);
  };

  const handleDocUpload = useCallback((file: File, docType: string) => {
    setDocUploaded(prev => ({ ...prev, [docType]: true }));
    setDocFile(prev => ({ ...prev, [docType]: file }));
    setErrors(prev => ({ ...prev, [docType]: "" }));
    setValidating(true);
    setTimeout(() => setValidating(false), 1500);
  }, []);

  const handleDocRemove = useCallback((docType: string) => {
    setDocUploaded(prev => ({ ...prev, [docType]: false }));
    setDocFile(prev => { const n = { ...prev }; delete n[docType]; return n; });
  }, []);

  const handleSelfieCapture = useCallback((blob: Blob) => {
    setSelfieBlob(blob);
    setErrors(prev => ({ ...prev, selfie: "" }));
  }, []);

  const handleCompanyPhotoCapture = useCallback((blob: Blob) => {
    setCompanyPhotoBlob(blob);
    setErrors(prev => ({ ...prev, companyPhoto: "" }));
  }, []);

  function validateStep(): boolean {
    const newErrors: Record<string, string> = {};

    if (step === 3 && profileType !== "passenger") {
      if (profileType === "driver" || profileType === "transporter") {
        if (!docUploaded["cnh"] && !docUploaded["drivers_license"]) newErrors.cnh = "CNH é obrigatória";
        if (!docUploaded["vehicle_photo"] && !docUploaded["vehicle_doc"]) newErrors.vehicle_doc = "Documento do veículo é obrigatório";
      }
      if (profileType === "company") {
        if (!companyPhotoBlob) newErrors.companyPhoto = "Foto do estabelecimento é obrigatória";
      }
    }

    if (step === 4 && profileType === "passenger" && !selfieBlob) newErrors.selfie = "Selfie é obrigatória";
    if (step === 4 && profileType !== "passenger" && !selfieBlob) newErrors.selfie = "Selfie é obrigatória";

    const dataStep = profileType === "passenger" ? 4 : 5;
    if (step === dataStep) {
      if (!formData.name) newErrors.name = "Nome é obrigatório";
      if (!formData.email) newErrors.email = "Email é obrigatório";
      if (!formData.phone) newErrors.phone = "Telefone é obrigatório";
      if (!formData.password || formData.password.length < 6) newErrors.password = "Mínimo 6 caracteres";
      if (country.hasCPF && formData.cpf && !validateCPF(formData.cpf)) newErrors.cpf = "CPF inválido";

      if (profileType === "driver" || profileType === "transporter") {
        if (!formData.vehiclePlate) newErrors.vehiclePlate = "Placa é obrigatória";
        if (!formData.vehicleModel) newErrors.vehicleModel = "Modelo é obrigatório";
        if (!formData.birthDate) newErrors.birthDate = "Data de nascimento é obrigatória";
        if (country.hasCPF && !formData.cpf) newErrors.cpf = "CPF é obrigatório";
      }

      if (profileType === "company") {
        if (!formData.corporateName) newErrors.corporateName = "Razão social é obrigatória";
        if (country.hasCNPJ && !formData.cnpj) newErrors.cnpj = "CNPJ é obrigatório";
        if (country.hasCNPJ && formData.cnpj && !validateCNPJ(formData.cnpj)) newErrors.cnpj = "CNPJ inválido";
        if (!formData.companyAddress) newErrors.companyAddress = "Endereço é obrigatório";
        if (!formData.responsibleName) newErrors.responsibleName = "Nome do responsável é obrigatório";
      }

      if (selectedDoc === "passport" && formData.document && !validatePassport(formData.document, country.code)) {
        newErrors.document = "Passaporte inválido";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validateStep()) nextStep();
  }

  async function uploadFile(file: Blob | File, bucket: string, userId: string, docType: string): Promise<string | null> {
    const fd = new FormData();
    fd.append("file", file, `${docType}.jpg`);
    fd.append("bucket", bucket);
    fd.append("userId", userId);
    fd.append("docType", docType);
    try {
      const res = await fetch("/api/storage/upload", { method: "POST", body: fd });
      const data = await res.json();
      return data.path || null;
    } catch { return null; }
  }

  async function handleSubmit() {
    if (!validateStep()) return;
    setLoading(true);

    const metadata: Record<string, string> = {
      full_name: formData.name,
      phone: formData.phone,
      country: country.code,
      cpf: formData.cpf,
      cnpj: formData.cnpj,
      birth_date: formData.birthDate,
      document: formData.document,
    };

    if (profileType === "driver" || profileType === "transporter") {
      metadata.vehicle_model = formData.vehicleModel;
      metadata.vehicle_plate = formData.vehiclePlate;
      metadata.vehicle_brand = formData.vehicleBrand;
      metadata.vehicle_color = formData.vehicleColor;
      metadata.vehicle_year = formData.vehicleYear;
      metadata.vehicle_category = formData.vehicleCategory;
    }

    if (profileType === "company") {
      metadata.corporate_name = formData.corporateName;
      metadata.trade_name = formData.tradeName;
      metadata.company_address = formData.companyAddress;
      metadata.opening_hours = formData.openingHours;
      metadata.service_description = formData.serviceDescription;
      metadata.responsible_name = formData.responsibleName;
    }

    const res = await signUp(formData.email, formData.password, profileType as Role, metadata);
    if (res.error) {
      setLoading(false);
      setErrors({ email: res.error });
      return;
    }

    const userId = res.user?.id;
    if (userId) {
      const uploads: Promise<void>[] = [];

      if (selfieBlob) {
        uploads.push(
          uploadFile(selfieBlob, "documents", userId, "selfie").then(() => {})
        );
      }

      if (profileType === "driver" || profileType === "transporter") {
        for (const [docType] of Object.entries(docFile)) {
          const file = docFile[docType];
          if (file && file.size > 0) {
            uploads.push(
              uploadFile(file, "drivers", userId, docType).then(() => {})
            );
          }
        }
        const vehicleBucket = docUploaded["vehicle_photo"] ? "vehicles" : "documents";
        if (docFile["vehicle_photo"]) {
          uploads.push(
            uploadFile(docFile["vehicle_photo"], vehicleBucket, userId, "vehicle_photo").then(() => {})
          );
        }
      }

      if (profileType === "company" && companyPhotoBlob) {
        uploads.push(
          uploadFile(companyPhotoBlob, "companies", userId, "company_photo").then(() => {})
        );
      }

      await Promise.allSettled(uploads);
    }

    setLoading(false);
    setStep(totalSteps);
  }

  const availableDocs = country.documentTypes;
  const currentDoc = availableDocs.find(d => d.id === selectedDoc);
  const dataStep = profileType === "passenger" ? 4 : 5;
  const selfieStep = profileType === "passenger" ? 3 : 4;
  const docStep = profileType === "passenger" ? -1 : 3;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-2xl z-10">
        {/* Progress bar */}
        <div className="flex items-center mb-6 md:mb-8 gap-1.5 md:gap-2 overflow-x-auto pb-1">
          <Link href="/" className="p-2 md:p-2 mr-1 md:mr-2 bg-card-bg border border-card-border rounded-full hover:bg-[#2a2a2a] transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          {stepLabels.map((label, i) => (
            <div key={i} className="flex items-center gap-1.5 md:gap-2">
              <div className={`w-8 h-8 md:w-7 md:h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                i + 1 === step ? "bg-primary text-background scale-110" :
                i + 1 < step ? "bg-primary/30 text-primary" :
                "bg-card-bg text-gray-500"
              }`}>{i + 1 < step ? <Check className="w-3.5 h-3.5" /> : i + 1}</div>
              {i < stepLabels.length - 1 && <div className={`w-4 md:w-6 h-0.5 ${i + 1 < step ? "bg-primary" : "bg-card-border"}`} />}
            </div>
          ))}
        </div>

        <div className="glass-panel p-6 md:p-10 relative overflow-hidden">
          <div>
            {/* STEP 1: SELECIONAR PERFIL */}
            {step === 1 && (
              <div className="space-y-5 md:space-y-6">
                <h2 className="text-xl md:text-2xl font-bold text-center">Escolha seu Perfil</h2>
                <p className="text-gray-400 text-center text-xs md:text-sm">Selecione como você usará a plataforma</p>
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {[
                    { type: "passenger" as ProfileType, icon: <User className="w-6 h-6 md:w-8 md:h-8" />, title: "Passageiro", desc: "Solicitar viagens" },
                    { type: "driver" as ProfileType, icon: <Car className="w-6 h-6 md:w-8 md:h-8" />, title: "Motorista", desc: "Corridas e entregas" },
                    { type: "company" as ProfileType, icon: <Building className="w-6 h-6 md:w-8 md:h-8" />, title: "Empresa", desc: "Enviar fretes" },
                    { type: "transporter" as ProfileType, icon: <Truck className="w-6 h-6 md:w-8 md:h-8" />, title: "Transportador", desc: "Cargas pesadas" },
                  ].map(p => (
                    <button key={p.type} onClick={() => handleProfileSelect(p.type)}
                      className="flex flex-col items-center p-5 md:p-6 bg-background border border-card-border rounded-2xl hover:border-primary/50 transition-all group hover:scale-[1.02]"
                    >
                      <div className="p-3 md:p-4 bg-card-bg rounded-full mb-3 md:mb-4 group-hover:scale-110 transition-transform text-primary">{p.icon}</div>
                      <span className="font-semibold text-sm md:text-lg">{p.title}</span>
                      <span className="text-[11px] md:text-sm text-gray-400 mt-0.5 md:mt-1">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 2: PAÍS / CIDADANIA */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <Globe className="w-8 h-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold">Sua Nacionalidade</h2>
                    <p className="text-gray-400 text-sm">Selecione seu país de cidadania para definir documentos e moeda</p>
                  </div>
                </div>
                <CountrySelector selected={country} onSelect={setCountry} />
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-gray-300">
                  <strong className="text-primary">Por que isso importa?</strong> Seus documentos, moeda, idioma e regras serão baseados no seu país de cidadania.
                </div>
                <button onClick={nextStep} className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98]">
                  Continuar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 3: DOCUMENTOS (para motorista/empresa) OU SELFIE (para passageiro) */}
            {step === 3 && profileType === "passenger" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <Camera className="w-8 h-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold">Reconhecimento Facial</h2>
                    <p className="text-gray-400 text-sm">Apenas uma selfie para confirmar sua identidade</p>
                  </div>
                </div>
                <SelfieCapture onCapture={handleSelfieCapture} livenessRequired={false} />
                {errors.selfie && <p className="text-red-400 text-sm">{errors.selfie}</p>}
                <button onClick={handleNext} disabled={!selfieBlob}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98]"
                >Continuar <ChevronRight className="w-5 h-5" /></button>
              </div>
            )}

            {step === 3 && profileType !== "passenger" && (
              <div className="space-y-6">
                {profileType === "driver" || profileType === "transporter" ? (
                  <>
                    <div className="flex items-center gap-4 mb-2">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <h2 className="text-2xl font-bold">Documentos do Motorista</h2>
                        <p className="text-gray-400 text-sm">Envie sua CNH e documentos do veículo</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-300 mb-2">CNH (Carteira de Motorista)</p>
                        {availableDocs.filter(d => d.id === "cnh" || d.id === "drivers_license").map(doc => (
                          <DocumentUpload
                            key={doc.id}
                            documentType={doc}
                            onUpload={handleDocUpload}
                            onRemove={handleDocRemove}
                            uploaded={!!docUploaded[doc.id]}
                            validating={validating}
                          />
                        ))}
                        {errors.cnh && <p className="text-red-400 text-xs mt-1">{errors.cnh}</p>}
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-300 mb-2">Foto do Veículo</p>
                        <div className="border-2 border-dashed border-card-border rounded-xl p-5 text-center hover:border-primary/50 transition cursor-pointer"
                          onClick={() => {
                            const input = document.createElement("input");
                            input.type = "file";
                            input.accept = "image/*";
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) handleDocUpload(file, "vehicle_photo");
                            };
                            input.click();
                          }}>
                          {docUploaded["vehicle_photo"] ? (
                            <div className="flex items-center justify-center gap-2 text-primary">
                              <Check className="w-5 h-5" />
                              <span className="text-sm font-medium">Foto do veículo enviada</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              <Camera className="w-8 h-8 text-gray-400" />
                              <span className="text-sm text-gray-400">Clique para enviar foto do veículo</span>
                            </div>
                          )}
                        </div>
                        {errors.vehicle_doc && <p className="text-red-400 text-xs mt-1">{errors.vehicle_doc}</p>}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-4 mb-2">
                      <Building className="w-8 h-8 text-primary" />
                      <div>
                        <h2 className="text-2xl font-bold">Foto do Estabelecimento</h2>
                        <p className="text-gray-400 text-sm">Envie uma foto da fachada ou local da empresa</p>
                      </div>
                    </div>

                    <div className="border-2 border-dashed border-card-border rounded-xl p-8 text-center hover:border-primary/50 transition cursor-pointer"
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = "image/*";
                        input.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (file) handleCompanyPhotoCapture(file);
                        };
                        input.click();
                      }}>
                      {companyPhotoBlob ? (
                        <div className="space-y-3">
                          <img src={URL.createObjectURL(companyPhotoBlob)} alt="Empresa" className="w-full h-40 object-cover rounded-lg" />
                          <div className="flex items-center justify-center gap-2 text-primary">
                            <Check className="w-5 h-5" />
                            <span className="text-sm font-medium">Foto enviada</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-3">
                          <ImageIcon className="w-12 h-12 text-gray-400" />
                          <span className="text-gray-400">Clique para enviar foto do estabelecimento</span>
                          <span className="text-xs text-gray-600">JPG ou PNG</span>
                        </div>
                      )}
                    </div>
                    {errors.companyPhoto && <p className="text-red-400 text-sm">{errors.companyPhoto}</p>}
                  </>
                )}

                <button onClick={handleNext} className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98]">
                  Continuar <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* STEP 4: SELFIE (para motorista/empresa) */}
            {step === 4 && profileType !== "passenger" && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <Shield className="w-8 h-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold">Verificação Facial</h2>
                    <p className="text-gray-400 text-sm">Tire uma selfie para confirmar sua identidade</p>
                  </div>
                </div>
                <SelfieCapture onCapture={handleSelfieCapture} livenessRequired={true} />
                {errors.selfie && <p className="text-red-400 text-sm">{errors.selfie}</p>}
                <button onClick={handleNext} disabled={!selfieBlob}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98]"
                >Continuar <ChevronRight className="w-5 h-5" /></button>
              </motion.div>
            )}

            {/* STEP 5 (ou 4 para passageiro): DADOS PESSOAIS + ESPECÍFICOS */}
            {step === dataStep && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 mb-2">
                  <User className="w-8 h-8 text-primary" />
                  <div>
                    <h2 className="text-2xl font-bold">Seus Dados</h2>
                    <p className="text-gray-400 text-sm">
                      {profileType === "driver" ? "Informe seus dados e do veículo" :
                       profileType === "company" ? "Informe os dados da empresa" :
                       "Complete suas informações pessoais"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <InputField label="Nome Completo" value={formData.name} onChange={v => setFormData(p => ({ ...p, name: v }))} error={errors.name} />
                  <InputField label="Email" type="email" value={formData.email} onChange={v => setFormData(p => ({ ...p, email: v }))} error={errors.email} />

                  <div className="flex flex-col gap-1.5 md:gap-2">
                    <label className="text-xs md:text-sm text-gray-400">Telefone</label>
                    <div className="flex gap-2">
                      <div className="bg-background border border-card-border rounded-lg px-3 flex items-center text-gray-400 text-sm">{country.phoneCode}</div>
                      <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                        className="flex-1 bg-background border border-card-border rounded-lg p-3.5 md:p-3 text-white focus:border-primary focus:outline-none transition-colors" />
                    </div>
                    {errors.phone && <p className="text-red-400 text-[10px] md:text-xs">{errors.phone}</p>}
                  </div>

                  <InputField label="Senha" type="password" value={formData.password} onChange={v => setFormData(p => ({ ...p, password: v }))} error={errors.password} />

                  {profileType !== "passenger" && (
                    <InputField label="Data de Nascimento" type="date" value={formData.birthDate} onChange={v => setFormData(p => ({ ...p, birthDate: v }))} error={errors.birthDate} />
                  )}

                  {country.hasCPF && profileType !== "company" && (
                    <InputField label="CPF" value={formData.cpf} onChange={v => setFormData(p => ({ ...p, cpf: v }))} error={errors.cpf} mask="000.000.000-00" />
                  )}
                </div>

                {/* CAMPOS ESPECÍFICOS DE MOTORISTA */}
                {(profileType === "driver" || profileType === "transporter") && (
                  <div className="border-t border-card-border pt-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Car className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-white">Dados do Veículo</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <InputField label="Modelo" value={formData.vehicleModel} onChange={v => setFormData(p => ({ ...p, vehicleModel: v }))} error={errors.vehicleModel} placeholder="Ex: Honda Civic" />
                      <InputField label="Placa" value={formData.vehiclePlate} onChange={v => setFormData(p => ({ ...p, vehiclePlate: v }))} error={errors.vehiclePlate} placeholder="ABC-1D23" />
                      <InputField label="Marca" value={formData.vehicleBrand} onChange={v => setFormData(p => ({ ...p, vehicleBrand: v }))} placeholder="Ex: Honda" />
                      <InputField label="Cor" value={formData.vehicleColor} onChange={v => setFormData(p => ({ ...p, vehicleColor: v }))} placeholder="Ex: Preto" />
                      <InputField label="Ano" value={formData.vehicleYear} onChange={v => setFormData(p => ({ ...p, vehicleYear: v }))} placeholder="2024" />
                      <div className="flex flex-col gap-1.5 md:gap-2">
                        <label className="text-xs md:text-sm text-gray-400">Categoria</label>
                        <select value={formData.vehicleCategory} onChange={e => setFormData(p => ({ ...p, vehicleCategory: e.target.value }))}
                          className="bg-background border border-card-border rounded-lg p-3.5 md:p-3 text-white focus:border-primary focus:outline-none transition-colors">
                          {VEHICLE_CATEGORIES.map(c => <option key={c.id} value={c.id} className="bg-[#1c1c1c]">{c.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* CAMPOS ESPECÍFICOS DE EMPRESA */}
                {profileType === "company" && (
                  <div className="border-t border-card-border pt-5 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Building className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-white">Dados da Empresa</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <InputField label="Razão Social" value={formData.corporateName} onChange={v => setFormData(p => ({ ...p, corporateName: v }))} error={errors.corporateName} />
                      <InputField label="Nome Fantasia" value={formData.tradeName} onChange={v => setFormData(p => ({ ...p, tradeName: v }))} />
                      <InputField label="Nome do Responsável" value={formData.responsibleName} onChange={v => setFormData(p => ({ ...p, responsibleName: v }))} error={errors.responsibleName} />
                      {country.hasCNPJ && (
                        <InputField label="CNPJ" value={formData.cnpj} onChange={v => setFormData(p => ({ ...p, cnpj: v }))} error={errors.cnpj} mask="00.000.000/0000-00" />
                      )}
                    </div>

                    <div className="flex flex-col gap-1.5 md:gap-2">
                      <label className="text-xs md:text-sm text-gray-400">Endereço da Empresa</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" value={formData.companyAddress} onChange={e => setFormData(p => ({ ...p, companyAddress: e.target.value }))}
                          placeholder="Rua, número, bairro, cidade"
                          className="w-full bg-background border border-card-border rounded-lg p-3.5 md:p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
                      </div>
                      {errors.companyAddress && <p className="text-red-400 text-[10px] md:text-xs">{errors.companyAddress}</p>}
                    </div>

                    <div className="flex flex-col gap-1.5 md:gap-2">
                      <label className="text-xs md:text-sm text-gray-400">Horário de Funcionamento</label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input type="text" value={formData.openingHours} onChange={e => setFormData(p => ({ ...p, openingHours: e.target.value }))}
                          placeholder="Ex: Seg-Sex 08:00-18:00, Sáb 08:00-12:00"
                          className="w-full bg-background border border-card-border rounded-lg p-3.5 md:p-3 pl-10 text-white focus:border-primary focus:outline-none transition-colors" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 md:gap-2">
                      <label className="text-xs md:text-sm text-gray-400">Descrição dos Serviços</label>
                      <textarea value={formData.serviceDescription} onChange={e => setFormData(p => ({ ...p, serviceDescription: e.target.value }))}
                        placeholder="Descreva os serviços que sua empresa oferece (entregas, fretes, etc.)"
                        className="w-full bg-background border border-card-border rounded-lg p-3.5 md:p-3 text-white focus:border-primary focus:outline-none transition-colors min-h-[80px] resize-none" />
                    </div>
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 accent-primary rounded bg-background border-card-border" />
                  <span className="text-xs text-gray-400">Aceito os <Link href="/terms" className="text-primary hover:underline">Termos de Uso</Link> e <Link href="/privacy" className="text-primary hover:underline">Política de Privacidade</Link></span>
                </label>

                <button onClick={handleSubmit} disabled={loading}
                  className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 text-background font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[0.98] shadow-[0_0_20px_rgba(62,203,142,0.2)]"
                >
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Criando conta...</> : <>Criar Conta <Check className="w-5 h-5" /></>}
                </button>
              </div>
            )}

            {/* STEP FINAL: CONTA CRIADA */}
            {step === totalSteps && (
              <div className="text-center py-10 space-y-6">
                <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold">Conta Criada!</h2>
                <p className="text-gray-400">
                  {profileType === "driver" ? "Sua conta de motorista foi criada. Agora vamos verificar seus documentos." :
                   profileType === "company" ? "Sua empresa foi cadastrada.分析aremos os documentos e liberamos o acesso." :
                   "Sua conta foi criada com sucesso!"}
                </p>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-gray-300">
                  Seu status atual: <strong className="text-yellow-400">PENDING_VERIFICATION</strong>
                  <p className="text-xs text-gray-500 mt-1">Você receberá uma notificação quando for aprovado.</p>
                </div>
                <button onClick={() => router.push(getDashboardRoute(profileType as Role))}
                  className="w-full bg-primary hover:bg-primary-hover text-background font-bold py-4 rounded-xl transition-all hover:scale-[0.98]"
                >Ir para o Dashboard</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, error, mask, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; error?: string; mask?: string; placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5 md:gap-2">
      <label className="text-xs md:text-sm text-gray-400">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="bg-background border border-card-border rounded-lg p-3.5 md:p-3 text-white focus:border-primary focus:outline-none transition-colors"
        placeholder={placeholder || mask || `Seu ${label.toLowerCase()}`} />
      {error && <p className="text-red-400 text-[10px] md:text-xs">{error}</p>}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-primary">Carregando...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
