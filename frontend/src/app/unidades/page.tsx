"use client";

import { useUnits } from "@/hooks/useUnits";
import PageHeader from "@/components/layout/PageHeader";
import Card, { CardContent } from "@/components/ui/Card";
import DataTable from "@/components/ui/Table";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { FiPlus } from "react-icons/fi";
import Link from "next/link";
import { formatPhone } from "@/lib/utils";

export default function UnitsPage() {
  const { units, isLoading } = useUnits();

  const columns = [
    { key: "name", label: "Unidade", render: (val: string) => <span className="font-medium text-gray-900">{val}</span> },
    { key: "phone", label: "Telefone", render: (val: string | null) => val ? formatPhone(val) : "-" },
    {
      key: "actions",
      label: "Ações",
      render: (_: any, row: any) => (
        <Link href={`/unidades/${row.id}`}>
          <Button size="sm" variant="outline">
            Editar
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader 
        title="Mapeamento de 10 Unidades" 
        subtitle="Visão geral e status operacional das lojas"
        action={
          <Link href="/unidades/nova">
            <Button className="gap-2">
              <FiPlus /> Nova Unidade
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <DataTable 
            columns={columns} 
            data={units} 
          />
        </CardContent>
      </Card>
    </div>
  );
}
