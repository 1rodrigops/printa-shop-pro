import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Download, FileText, Printer } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface RelatoriosFiltrosProps {
  onDateRangeChange: (start: Date, end: Date) => void;
}

const RelatoriosFiltros = ({ onDateRangeChange }: RelatoriosFiltrosProps) => {
  const [startDate, setStartDate] = useState<Date>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  const handleApplyFilter = () => {
    onDateRangeChange(startDate, endDate);
    toast.success("Filtros aplicados com sucesso!");
  };

  const handleExportPDF = () => {
    toast.info("Exportação de PDF em desenvolvimento");
  };

  const handleExportCSV = () => {
    toast.info("Exportação de CSV em desenvolvimento");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Card className="p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label>Data Inicial</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(startDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={(date) => date && setStartDate(date)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 space-y-2">
          <Label>Data Final</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(endDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-white" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={(date) => date && setEndDate(date)}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={handleApplyFilter}>Aplicar Filtros</Button>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleExportPDF}>
            <FileText className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleExportCSV}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default RelatoriosFiltros;
