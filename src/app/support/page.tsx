"use client";

import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, HelpCircle, ChevronRight, Headphones, FileText } from "lucide-react";
import Link from "next/link";

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" style={{ minHeight: "100dvh" }}>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold">Central de Ajuda</h1>
          <p className="text-sm text-gray-400 mt-1">Estamos aqui para ajudar 24/7</p>
        </motion.div>

        <div className="space-y-3">
          {[
            { icon: MessageCircle, label: "Chat ao vivo", desc: "Respondemos em menos de 2 minutos", color: "#3ECB8E", href: "/chat" },
            { icon: Phone, label: "Emergência", desc: "Ligue para 190 ou use o botão SOS no app", color: "#EF4444", href: "#" },
            { icon: Mail, label: "Email", desc: "ajuda@txdapp.com - Respondemos em até 2h", color: "#60a5fa", href: "mailto:ajuda@txdapp.com" },
            { icon: HelpCircle, label: "Perguntas frequentes", desc: "Tire suas dúvidas rapidamente", color: "#8B5CF6", href: "#faq" },
            { icon: FileText, label: "Guia de uso", desc: "Aprenda a usar todas as funcionalidades", color: "#F59E0B", href: "#guide" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <motion.div whileHover={{ x: 4 }} className="glass-panel p-4 flex items-center gap-3 cursor-pointer">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
