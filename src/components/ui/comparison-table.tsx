import type { Product } from '@/lib/types';

interface ComparisonTableProps {
  products: (Product & { rank?: number })[];
  columns: string[];
  getValue: (product: Product, column: string) => string;
}

export default function ComparisonTable({
  products,
  columns,
  getValue,
}: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700 first:sticky first:left-0 first:bg-gray-50 first:z-10"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              className={`border-t border-gray-100 ${
                product.rank === 1 ? 'bg-orange-50' : ''
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col}
                  className="whitespace-nowrap px-4 py-3 text-gray-600 first:sticky first:left-0 first:bg-inherit first:z-10 first:font-medium first:text-gray-900"
                >
                  {getValue(product, col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
