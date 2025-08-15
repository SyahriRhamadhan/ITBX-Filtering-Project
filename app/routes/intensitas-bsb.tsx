import type { MetaFunction } from "@remix-run/node";
import IntensitasFilter from "~/components/IntensitasFilter";

export const meta: MetaFunction = () => {
  return [
    { title: "Filter Intensitas Pemanfaatan Ruang BSB - RDTR Builder" },
    { name: "description", content: "Filter dan analisis ketentuan intensitas pemanfaatan ruang BSB berdasarkan zona dan sub zona." },
  ];
};

export default function IntensitasBSBPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <IntensitasFilter dataSource="bsb" />
    </div>
  );
}