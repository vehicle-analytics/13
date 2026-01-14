/**
 * 📈 Алгоритм прогнозу закупівель запчастин та бюджету для автопарку
 * Розраховує прогноз на 6-12 місяців вперед
 */

class PartsPurchaseForecast {
    constructor() {
        // Коефіцієнти для різних марок авто
        this.brandCoefficients = {
            'Mercedes Sprinter': { cost: 1.2, reliability: 1.0 },
            'Sprinter': { cost: 1.2, reliability: 1.0 },
            'Volkswagen Crafter': { cost: 1.15, reliability: 0.95 },
            'Crafter': { cost: 1.15, reliability: 0.95 },
            'VW LT': { cost: 1.0, reliability: 0.90 },
            'LT': { cost: 1.0, reliability: 0.90 },
            'Peugeot 301': { cost: 1.1, reliability: 1.0 },
            '301': { cost: 1.1, reliability: 1.0 },
            'Fiat Tipo': { cost: 1.1, reliability: 1.0 },
            'Tipo': { cost: 1.1, reliability: 1.0 }
        };

        // Середні місячні пробіги за замовчуванням (км/місяць)
        this.defaultMonthlyMileage = {
            'Sprinter': 2500,
            'Crafter': 2500,
            'LT': 2000,
            '301': 1500,
            'Tipo': 1500,
            'default': 2000
        };

        // Базові вартості запчастин (в гривнях)
        this.basePartCosts = {
            'ТО (масло+фільтри) 🛢️': 2000,
            'ГРМ (ролики+ремінь) ⚙️': 5000,
            'Помпа 💧': 3000,
            'Обвідний ремінь+ролики 🔧': 2500,
            'Гальмівні диски передні💿': 4000,
            'Гальмівні диски задні💿': 3500,
            'Гальмівні колодки передні🛑': 1500,
            'Гальмівні колодки задні🛑': 1200,
            'Гальмівні колодки ручного гальма🛑': 800,
            'Амортизатори передні🔧': 3000,
            'Амортизатори задні🔧': 2800,
            'Опора амортизаторів 🛠️': 1500,
            'Шарова опора ⚪': 2000,
            'Рульова тяга 🔗': 1200,
            'Рульовий накінечник 🔩': 800,
            'Зчеплення ⚙️': 8000,
            'Стартер 🔋': 4000,
            'Генератор ⚡': 5000,
            'Акумулятор 🔋': 3000
        };

        // Коефіцієнт вартості робіт (від вартості запчастини)
        this.workCostCoefficient = 0.25; // 25%

        // Коефіцієнт запасу на непредбачені витрати
        this.reserveCoefficient = 0.15; // 15%
    }

    /**
     * Отримує коефіцієнти для марки авто
     * @param {string} model - Модель авто
     * @returns {Object} Коефіцієнти {cost, reliability}
     */
    getBrandCoefficients(model) {
        if (!model) return { cost: 1.0, reliability: 1.0 };

        const modelUpper = model.toUpperCase();
        
        for (const [brand, coeffs] of Object.entries(this.brandCoefficients)) {
            if (modelUpper.includes(brand.toUpperCase())) {
                return coeffs;
            }
        }

        return { cost: 1.0, reliability: 1.0 };
    }

    /**
     * Розраховує середній місячний пробіг для авто
     * @param {Object} car - Об'єкт авто
     * @returns {number} Пробіг в км/місяць
     */
    calculateAverageMonthlyMileage(car) {
        if (!car.history || car.history.length < 2) {
            // Використовуємо значення за замовчуванням
            const model = car.model || '';
            for (const [brand, mileage] of Object.entries(this.defaultMonthlyMileage)) {
                if (brand !== 'default' && model.toUpperCase().includes(brand.toUpperCase())) {
                    return mileage;
                }
            }
            return this.defaultMonthlyMileage.default;
        }

        // Розраховуємо на основі історії
        const sortedHistory = [...car.history].sort((a, b) => new Date(a.date) - new Date(b.date));
        if (sortedHistory.length < 2) {
            return this.defaultMonthlyMileage.default;
        }

        const firstRecord = sortedHistory[0];
        const lastRecord = sortedHistory[sortedHistory.length - 1];

        const daysDiff = (new Date(lastRecord.date) - new Date(firstRecord.date)) / (1000 * 60 * 60 * 24);
        const mileageDiff = lastRecord.mileage - firstRecord.mileage;

        if (daysDiff <= 0) {
            return this.defaultMonthlyMileage.default;
        }

        const monthlyMileage = (mileageDiff / daysDiff) * 30;
        return monthlyMileage > 0 ? monthlyMileage : this.defaultMonthlyMileage.default;
    }

    /**
     * Розраховує потребу в заміні запчастини для одного авто
     * @param {Object} car - Об'єкт авто
     * @param {string} partName - Назва запчастини
     * @param {Object} regulation - Регламент ТО для цієї запчастини
     * @param {Object} part - Дані про запчастину
     * @param {number} monthsAhead - На скільки місяців вперед прогнозуємо
     * @returns {Object|null} Інформація про потребу заміни або null
     */
    calculatePartReplacementNeed(car, partName, regulation, part, monthsAhead) {
        if (!regulation || regulation.normalValue === 'chain') {
            return null;
        }

        const brandCoeffs = this.getBrandCoefficients(car.model);
        const avgMonthlyMileage = this.calculateAverageMonthlyMileage(car);
        const now = new Date();

        let monthsUntilReplacement = null;
        let replacementMonth = null;
        let urgency = null; // 'critical', 'planned', 'forecasted'
        let probability = 0;

        if (regulation.periodType === 'пробіг') {
            const remainingKm = regulation.normalValue - part.mileageDiff;
            const monthsByMileage = remainingKm / avgMonthlyMileage;
            
            if (monthsByMileage <= 0) {
                // Вже пройшов термін
                urgency = 'critical';
                probability = 0.8;
                replacementMonth = 0; // Цей місяць
            } else if (monthsByMileage <= monthsAhead) {
                monthsUntilReplacement = monthsByMileage;
                replacementMonth = Math.ceil(monthsByMileage);
                
                if (monthsByMileage <= 1) {
                    urgency = 'critical';
                    probability = 0.7;
                } else if (monthsByMileage <= 3) {
                    urgency = 'planned';
                    probability = 0.5;
                } else {
                    urgency = 'forecasted';
                    probability = 0.3;
                }
            }
        } else if (regulation.periodType === 'місяць') {
            const remainingMonths = regulation.normalValue - Math.floor(part.daysDiff / 30);
            
            if (remainingMonths <= 0) {
                urgency = 'critical';
                probability = 0.8;
                replacementMonth = 0;
            } else if (remainingMonths <= monthsAhead) {
                monthsUntilReplacement = remainingMonths;
                replacementMonth = remainingMonths;
                
                if (remainingMonths <= 1) {
                    urgency = 'critical';
                    probability = 0.7;
                } else if (remainingMonths <= 3) {
                    urgency = 'planned';
                    probability = 0.5;
                } else {
                    urgency = 'forecasted';
                    probability = 0.3;
                }
            }
        } else if (regulation.periodType === 'рік') {
            const remainingYears = regulation.normalValue - (part.daysDiff / 365);
            const remainingMonths = remainingYears * 12;
            
            if (remainingMonths <= 0) {
                urgency = 'critical';
                probability = 0.8;
                replacementMonth = 0;
            } else if (remainingMonths <= monthsAhead) {
                monthsUntilReplacement = remainingMonths;
                replacementMonth = Math.ceil(remainingMonths);
                
                if (remainingMonths <= 1) {
                    urgency = 'critical';
                    probability = 0.7;
                } else if (remainingMonths <= 3) {
                    urgency = 'planned';
                    probability = 0.5;
                } else {
                    urgency = 'forecasted';
                    probability = 0.3;
                }
            }
        }

        // Враховуємо статус запчастини
        if (part.status === 'critical') {
            urgency = 'critical';
            probability = Math.max(probability, 0.9);
            if (replacementMonth === null) replacementMonth = 0;
        } else if (part.status === 'warning') {
            if (urgency !== 'critical') {
                urgency = 'planned';
                probability = Math.max(probability, 0.6);
            }
        }

        // Враховуємо надійність марки
        probability *= brandCoeffs.reliability;

        if (replacementMonth === null || replacementMonth > monthsAhead) {
            return null;
        }

        // Розраховуємо вартість
        const baseCost = this.basePartCosts[partName] || 2000;
        const partCost = baseCost * brandCoeffs.cost;
        const workCost = partCost * this.workCostCoefficient;
        const totalCost = partCost + workCost;

        return {
            car: car.license,
            model: car.model,
            partName,
            urgency,
            probability,
            replacementMonth,
            monthsUntilReplacement,
            partCost,
            workCost,
            totalCost,
            regulation
        };
    }

    /**
     * Розраховує прогноз для всього автопарку
     * @param {Array} cars - Масив автомобілів
     * @param {Array} maintenanceRegulations - Регламенти ТО
     * @param {Function} findRegulationForCar - Функція пошуку регламенту
     * @param {number} monthsAhead - На скільки місяців вперед (6 або 12)
     * @returns {Object} Результати прогнозу
     */
    calculateForecast(cars, maintenanceRegulations, findRegulationForCar, monthsAhead = 6) {
        const forecast = {
            totalBudget: 0,
            byMonth: {},
            byPart: {},
            byCar: {},
            byBrand: {},
            topParts: [],
            risks: {
                budget: [],
                logistics: [],
                brand: null
            },
            recommendations: []
        };

        // Ініціалізуємо структуру по місяцях
        for (let i = 0; i < monthsAhead; i++) {
            forecast.byMonth[i] = {
                month: i,
                totalCost: 0,
                parts: [],
                cars: []
            };
        }

        // Аналізуємо кожне авто
        cars.forEach(car => {
            const brandCoeffs = this.getBrandCoefficients(car.model);
            const brandName = this.getBrandName(car.model);

            if (!forecast.byBrand[brandName]) {
                forecast.byBrand[brandName] = {
                    name: brandName,
                    carsCount: 0,
                    totalCost: 0,
                    parts: {}
                };
            }
            forecast.byBrand[brandName].carsCount += 1;

            if (!forecast.byCar[car.license]) {
                forecast.byCar[car.license] = {
                    license: car.license,
                    model: car.model,
                    totalCost: 0,
                    parts: []
                };
            }

            // Аналізуємо кожну запчастину
            for (const partName in car.parts) {
                const part = car.parts[partName];
                if (!part) continue;

                const regulation = findRegulationForCar(car.license, car.model, car.year, partName);
                const need = this.calculatePartReplacementNeed(car, partName, regulation, part, monthsAhead);

                if (need) {
                    const month = Math.min(need.replacementMonth, monthsAhead - 1);

                    // Додаємо до загального бюджету
                    forecast.totalBudget += need.totalCost;

                    // Додаємо до місяця
                    forecast.byMonth[month].totalCost += need.totalCost;
                    forecast.byMonth[month].parts.push(need);
                    forecast.byMonth[month].cars.push(car.license);

                    // Додаємо до запчастини
                    if (!forecast.byPart[partName]) {
                        forecast.byPart[partName] = {
                            name: partName,
                            totalCost: 0,
                            count: 0,
                            cars: []
                        };
                    }
                    forecast.byPart[partName].totalCost += need.totalCost;
                    forecast.byPart[partName].count += 1;
                    forecast.byPart[partName].cars.push(car.license);

                    // Додаємо до авто
                    forecast.byCar[car.license].totalCost += need.totalCost;
                    forecast.byCar[car.license].parts.push(need);

                    // Додаємо до марки
                    forecast.byBrand[brandName].totalCost += need.totalCost;
                    if (!forecast.byBrand[brandName].parts[partName]) {
                        forecast.byBrand[brandName].parts[partName] = {
                            count: 0,
                            cost: 0
                        };
                    }
                    forecast.byBrand[brandName].parts[partName].count += 1;
                    forecast.byBrand[brandName].parts[partName].cost += need.totalCost;
                }
            }
        });

        // Додаємо коефіцієнт запасу
        forecast.totalBudget *= (1 + this.reserveCoefficient);
        Object.keys(forecast.byMonth).forEach(month => {
            forecast.byMonth[month].totalCost *= (1 + this.reserveCoefficient);
        });

        // Формуємо топ-10 запчастин
        forecast.topParts = Object.values(forecast.byPart)
            .sort((a, b) => b.totalCost - a.totalCost)
            .slice(0, 10);

        // Аналіз ризиків
        this.analyzeRisks(forecast, monthsAhead);

        // Генерація рекомендацій
        this.generateRecommendations(forecast);

        return forecast;
    }

    /**
     * Аналізує ризики
     */
    analyzeRisks(forecast, monthsAhead) {
        const monthlyCosts = Object.values(forecast.byMonth).map(m => m.totalCost);
        const avgMonthlyCost = forecast.totalBudget / monthsAhead;

        // Бюджетний ризик
        monthlyCosts.forEach((cost, month) => {
            if (cost > avgMonthlyCost * 1.5) {
                forecast.risks.budget.push({
                    month,
                    cost,
                    percentage: (cost / avgMonthlyCost * 100).toFixed(1)
                });
            }
        });

        // Логістичний ризик (багато однотипних запчастин)
        Object.entries(forecast.byPart).forEach(([partName, data]) => {
            if (data.count > 5) {
                forecast.risks.logistics.push({
                    partName,
                    count: data.count,
                    cost: data.totalCost
                });
            }
        });

        // Марковий ризик
        const brandCosts = Object.values(forecast.byBrand).map(b => b.totalCost);
        const maxBrandCost = Math.max(...brandCosts);
        if (maxBrandCost > forecast.totalBudget * 0.6) {
            const riskyBrand = Object.values(forecast.byBrand).find(b => b.totalCost === maxBrandCost);
            forecast.risks.brand = {
                name: riskyBrand.name,
                percentage: (maxBrandCost / forecast.totalBudget * 100).toFixed(1),
                cost: maxBrandCost
            };
        }
    }

    /**
     * Генерує рекомендації
     */
    generateRecommendations(forecast) {
        // Рекомендація про оптові закупівлі
        forecast.risks.logistics.forEach(risk => {
            forecast.recommendations.push({
                type: 'bulk',
                text: `Рекомендуємо купити оптом ${risk.count} одиниць "${risk.partName}" для економії`,
                priority: 'high'
            });
        });

        // Рекомендація про резервний фонд
        const reserveAmount = forecast.totalBudget * 0.2;
        forecast.recommendations.push({
            type: 'reserve',
            text: `Створити резервний фонд: ${this.formatPrice(reserveAmount)} грн (20% від бюджету)`,
            priority: 'medium',
            amount: reserveAmount
        });

        // Рекомендація про перерозподіл робіт
        if (forecast.risks.budget.length > 0) {
            forecast.recommendations.push({
                type: 'redistribution',
                text: `Перерозподілити роботи для уникнення пікових навантажень в місяцях: ${forecast.risks.budget.map(r => r.month + 1).join(', ')}`,
                priority: 'medium'
            });
        }

        // Рекомендація про оптимізацію автопарку
        if (forecast.risks.brand) {
            forecast.recommendations.push({
                type: 'optimization',
                text: `Марка "${forecast.risks.brand.name}" складає ${forecast.risks.brand.percentage}% витрат. Розглянути оптимізацію автопарку.`,
                priority: 'low'
            });
        }
    }

    /**
     * Отримує назву марки з моделі
     */
    getBrandName(model) {
        if (!model) return 'Інші';
        
        const modelUpper = model.toUpperCase();
        if (modelUpper.includes('SPRINTER')) return 'Mercedes Sprinter';
        if (modelUpper.includes('CRAFTER')) return 'Volkswagen Crafter';
        if (modelUpper.includes('LT')) return 'VW LT';
        if (modelUpper.includes('301')) return 'Peugeot 301';
        if (modelUpper.includes('TIPO')) return 'Fiat Tipo';
        
        return model.split(' ')[0] || 'Інші';
    }

    /**
     * Форматує ціну
     */
    formatPrice(amount) {
        return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }
}

// Експортуємо для використання
window.PartsPurchaseForecast = PartsPurchaseForecast;
console.log('✅ Модуль прогнозу закупівель запчастин завантажено');
