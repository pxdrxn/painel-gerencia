/**
 * Utility functions — Formatters e helpers.
 */

export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatCPF(cpf: string): string {
  if (!cpf) return "";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatPhone(phone: string): string {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  }
  return phone;
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const [year, month, day] = dateStr.split("T")[0].split("-");
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

export function formatCurrency(value: number): string {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercentage(value: number): string {
  if (value === undefined || value === null) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    ativo: "bg-green-100 text-green-800",
    ferias: "bg-purple-100 text-purple-800",
    afastado: "bg-yellow-100 text-yellow-800",
    desligado: "bg-red-100 text-red-800",
    completa: "bg-green-100 text-green-800",
    parcial: "bg-yellow-100 text-yellow-800",
    critica: "bg-red-100 text-red-800",
    folga: "bg-blue-100 text-blue-800",
    falta: "bg-orange-100 text-orange-800",
    agendada: "bg-indigo-100 text-indigo-800",
    confirmada: "bg-emerald-100 text-emerald-800",
    cancelada: "bg-gray-100 text-gray-800",
  };
  return map[status.toLowerCase()] || "bg-gray-100 text-gray-800";
}
