import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from "lucide-react";
import { Transaction } from "@/types/finance";
import { getCategoriesByType } from "@/lib/categories";

interface TransactionFiltersProps {
  transactions: Transaction[];
  onFilterChange: (filteredTransactions: Transaction[]) => void;
}

interface Filters {
  search: string;
  type: 'all' | 'income' | 'expense';
  category: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}

const TransactionFilters = ({ transactions, onFilterChange }: TransactionFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    type: 'all',
    category: '',
    dateFrom: '',
    dateTo: '',
    minAmount: '',
    maxAmount: '',
  });

  const applyFilters = (newFilters: Filters) => {
    let filtered = [...transactions];

    // Filtro por búsqueda de texto
    if (newFilters.search) {
      const searchLower = newFilters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchLower) ||
        t.category?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro por tipo
    if (newFilters.type !== 'all') {
      filtered = filtered.filter(t => t.type === newFilters.type);
    }

    // Filtro por categoría
    if (newFilters.category) {
      filtered = filtered.filter(t => t.category === newFilters.category);
    }

    // Filtro por rango de fechas
    if (newFilters.dateFrom) {
      filtered = filtered.filter(t => new Date(t.date) >= new Date(newFilters.dateFrom));
    }
    if (newFilters.dateTo) {
      filtered = filtered.filter(t => new Date(t.date) <= new Date(newFilters.dateTo));
    }

    // Filtro por rango de montos
    if (newFilters.minAmount) {
      filtered = filtered.filter(t => t.amount >= Number(newFilters.minAmount));
    }
    if (newFilters.maxAmount) {
      filtered = filtered.filter(t => t.amount <= Number(newFilters.maxAmount));
    }

    onFilterChange(filtered);
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      type: 'all',
      category: '',
      dateFrom: '',
      dateTo: '',
      minAmount: '',
      maxAmount: '',
    };
    setFilters(clearedFilters);
    onFilterChange(transactions);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '' && value !== 'all');

  const getCategoriesForType = () => {
    if (filters.type === 'all') return [];
    return getCategoriesByType(filters.type as 'income' | 'expense');
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Buscar y Filtrar
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? 'Ocultar' : 'Filtros'}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Búsqueda básica */}
        <div>
          <Label htmlFor="search">Buscar</Label>
          <Input
            id="search"
            placeholder="Buscar por descripción o categoría..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="mt-1"
          />
        </div>

        {/* Filtros expandidos */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label>Tipo</Label>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Ingresos</SelectItem>
                  <SelectItem value="expense">Gastos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoría</Label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las categorías</SelectItem>
                  {getCategoriesForType().map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Desde</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Hasta</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Monto mínimo</Label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minAmount}
                onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Monto máximo</Label>
              <Input
                type="number"
                placeholder="Sin límite"
                value={filters.maxAmount}
                onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionFilters; 