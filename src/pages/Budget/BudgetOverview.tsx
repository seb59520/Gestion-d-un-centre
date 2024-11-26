import { useMemo } from 'react';
import { format } from 'date-fns';
import type { BudgetCategory, BudgetEntry } from '../../types';

interface BudgetOverviewProps {
  categories: BudgetCategory[];
  entries: BudgetEntry[];
  year: number;
  budgetType: 'civil' | 'school';
}

export default function BudgetOverview({
  categories,
  entries,
  year,
  budgetType
}: BudgetOverviewProps) {
  const stats = useMemo(() => {
    const totalBudget = categories.reduce((sum, cat) => sum + cat.annualBudget, 0);
    const totalSpent = entries
      .filter(entry => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0);
    const totalIncome = entries
      .filter(entry => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0);

    return {
      totalBudget,
      totalSpent,
      totalIncome,
      remaining: totalBudget - totalSpent + totalIncome
    };
  }, [categories, entries]);

  const categoryStats = useMemo(() => {
    return categories.map(category => {
      const spent = entries
        .filter(entry => entry.categoryId === category.id && entry.type === 'expense')
        .reduce((sum, entry) => sum + entry.amount, 0);
      const income = entries
        .filter(entry => entry.categoryId === category.id && entry.type === 'income')
        .reduce((sum, entry) => sum + entry.amount, 0);

      return {
        ...category,
        spent,
        income,
        remaining: category.annualBudget - spent + income,
        percentage: (spent / category.annualBudget) * 100
      };
    });
  }, [categories, entries]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Budget</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            €{stats.totalBudget.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Spent</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            €{stats.totalSpent.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900">Total Income</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            €{stats.totalIncome.toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900">Remaining</h3>
          <p className={`mt-2 text-3xl font-semibold ${
            stats.remaining >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            €{stats.remaining.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Category Breakdown</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Spent
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Income
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remaining
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categoryStats.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      €{category.annualBudget.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      €{category.spent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      €{category.income.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={category.remaining >= 0 ? 'text-green-600' : 'text-red-600'}>
                        €{category.remaining.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full ${
                            category.percentage > 90 ? 'bg-red-600' :
                            category.percentage > 70 ? 'bg-yellow-600' :
                            'bg-green-600'
                          }`}
                          style={{ width: `${Math.min(100, category.percentage)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}