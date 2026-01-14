/**
 * 📊 Аналіз частоти поломок по категоріях
 * Показує які системи автомобіля найчастіше виходять з ладу
 */

class BreakdownFrequencyAnalysis {
    constructor() {
        this.expenseCategories = window.EXPENSE_CATEGORIES_CONFIG || {};
    }

    /**
     * Аналізує частоту поломок по категоріях для автопарку
     * @param {Array} cars - Масив автомобілів
     * @param {Object} filters - Фільтри (selectedYear, selectedCity тощо)
     * @returns {Object} Статистика по категоріях
     */
    analyzeBreakdownFrequency(cars, filters = {}) {
        const stats = {
            byCategory: {},
            totalBreakdowns: 0,
            byCar: {}
        };

        // Фільтруємо авто за містом якщо потрібно
        let filteredCars = cars;
        if (filters.selectedCity && filters.selectedCity !== 'Всі міста') {
            filteredCars = cars.filter(car => car.city === filters.selectedCity);
        }

        // Аналізуємо кожне авто
        filteredCars.forEach(car => {
            // Фільтруємо історію за роком якщо потрібно
            let history = car.history || [];
            if (filters.selectedYear) {
                history = history.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate.getFullYear() === filters.selectedYear;
                });
            }

            // Аналізуємо записи історії
            history.forEach(record => {
                if (!record.description) return;

                // Визначаємо категорію витрат
                const category = this.detectExpenseCategory(record.description);
                
                // Рахуємо поломки (записи з витратами)
                if (record.totalWithVAT > 0) {
                    stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
                    stats.totalBreakdowns += 1;

                    // Статистика по авто
                    if (!stats.byCar[car.license]) {
                        stats.byCar[car.license] = {
                            license: car.license,
                            model: car.model,
                            city: car.city,
                            breakdowns: 0,
                            byCategory: {}
                        };
                    }
                    stats.byCar[car.license].breakdowns += 1;
                    stats.byCar[car.license].byCategory[category] = 
                        (stats.byCar[car.license].byCategory[category] || 0) + 1;
                }
            });
        });

        return stats;
    }

    /**
     * Генерує HTML для графіка частоти поломок
     * @param {Object} stats - Статистика з analyzeBreakdownFrequency
     * @param {Function} formatPrice - Функція форматування ціни
     * @returns {string} HTML код
     */
    generateBreakdownFrequencyChartHTML(stats, formatPrice) {
        if (!stats || stats.totalBreakdowns === 0) {
            return `
                <div class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p class="text-sm text-gray-500 text-center">Немає даних для відображення</p>
                </div>
            `;
        }

        // Сортуємо категорії за частотою
        const sortedCategories = Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10); // Топ-10 категорій

        const maxFrequency = Math.max(...sortedCategories.map(([_, count]) => count));

        return `
            <div class="mt-4">
                <h4 class="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <span>📊</span> Частота поломок по категоріях
                </h4>
                <div class="space-y-3">
                    ${sortedCategories.map(([category, count]) => {
                        const percentage = (count / stats.totalBreakdowns * 100).toFixed(1);
                        const barWidth = maxFrequency > 0 ? (count / maxFrequency * 100) : 0;
                        
                        return `
                            <div class="space-y-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-sm text-gray-700 font-medium">${category}</span>
                                    <div class="flex items-center gap-2">
                                        <span class="text-xs text-gray-500">${count} разів</span>
                                        <span class="text-xs font-semibold text-gray-600">${percentage}%</span>
                                    </div>
                                </div>
                                <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                    <div class="h-full bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 rounded-full transition-all duration-500" 
                                         style="width: ${barWidth}%"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="mt-3 pt-3 border-t border-gray-200">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-600">Всього поломок:</span>
                        <span class="font-bold text-gray-800">${stats.totalBreakdowns}</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Визначає категорію витрат з опису
     * @param {string} description - Опис запису
     * @returns {string} Назва категорії
     */
    detectExpenseCategory(description) {
        if (window.EXPENSE_CATEGORIES_UTILS && window.EXPENSE_CATEGORIES_UTILS.findCategory) {
            return window.EXPENSE_CATEGORIES_UTILS.findCategory(description);
        }
        
        // Fallback метод
        const descLower = description.toLowerCase();
        
        if (descLower.includes('масл') || descLower.includes('фільтр') || descLower.includes('то')) {
            return 'ТО та обслуговування';
        } else if (descLower.includes('гальм') || descLower.includes('колодк') || descLower.includes('диск')) {
            return 'Гальмівна система';
        } else if (descLower.includes('амортизатор') || descLower.includes('підвіск') || descLower.includes('ходов')) {
            return 'Ходова частина';
        } else if (descLower.includes('двигун') || descLower.includes('грм') || descLower.includes('помп')) {
            return 'Двигун';
        } else if (descLower.includes('акб') || descLower.includes('акумулятор') || descLower.includes('стартер')) {
            return 'Електрика';
        } else if (descLower.includes('шини') || descLower.includes('колес') || descLower.includes('диагност')) {
            return 'Ходова частина';
        } else {
            return 'Інші витрати';
        }
    }
}

// Експортуємо для використання
window.BreakdownFrequencyAnalysis = BreakdownFrequencyAnalysis;
console.log('✅ Модуль аналізу частоти поломок завантажено');
