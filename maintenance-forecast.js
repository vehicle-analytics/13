/**
 * ⏰ Прогноз наступного обслуговування та можливих поломок
 * Генерує прогноз на основі регламентів ТО та стану запчастин
 */

class MaintenanceForecast {
    constructor() {
        // Визначаємо групи запчастин
        this.brakeParts = [
            'Гальмівні диски передні💿',
            'Гальмівні диски задні💿',
            'Гальмівні колодки передні🛑',
            'Гальмівні колодки задні🛑',
            'Гальмівні колодки ручного гальма🛑'
        ];

        this.suspensionParts = [
            'Амортизатори передні🔧',
            'Амортизатори задні🔧',
            'Опора амортизаторів 🛠️',
            'Шарова опора ⚪',
            'Рульова тяга 🔗',
            'Рульовий накінечник 🔩'
        ];

        this.excludedParts = ['Стартер 🔋', 'Генератор ⚡', 'Акумулятор 🔋'];

        this.workParts = [
            'Діагностика ходової 🔍',
            'Розвал-сходження 📐',
            'Профілактика направляючих супортів 🛠️',
            "Компютерна діагностика 💻",
            'Прожиг сажового фільтру 🔥',
            'ТО (масло+фільтри) 🛢️'
        ];

        // Рекомендовані виробники
        this.manufacturers = {
            'ТО (масло+фільтри) 🛢️': ['MANN', 'KNECHT', 'MAHLE'],
            'ГРМ (ролики+ремінь) ⚙️': ['CONTINENTAL'],
            'Помпа 💧': ['INA', 'CONTINENTAL', 'Pierburg'],
            'Обвідний ремінь+ролики 🔧': ['CONTINENTAL', 'INA'],
            'Гальмівні диски передні💿': ['BREMBO', 'TRW', 'ROADHOUSE'],
            'Гальмівні диски задні💿': ['BREMBO', 'TRW', 'ROADHOUSE'],
            'Гальмівні колодки передні🛑': ['BREMBO', 'TRW', 'ROADHOUSE'],
            'Гальмівні колодки задні🛑': ['BREMBO', 'TRW', 'ROADHOUSE'],
            'Гальмівні колодки ручного гальма🛑': ['BREMBO', 'TRW', 'ROADHOUSE'],
            'Амортизатори передні🔧': ['SACHS', 'BILSTEIN'],
            'Амортизатори задні🔧': ['SACHS', 'BILSTEIN'],
            'Опора амортизаторів 🛠️': ['MEYLE', 'LEMFÖRDER'],
            'Шарова опора ⚪': ['MEYLE', 'LEMFÖRDER'],
            'Рульова тяга 🔗': ['MEYLE', 'LEMFÖRDER'],
            'Рульовий накінечник 🔩': ['MEYLE', 'LEMFÖRDER'],
            'Свічки запалювання 🔥': ['NGK', 'BOSCH', 'DENSO']
        };
    }

    /**
     * Отримує рекомендованих виробників для запчастини
     * @param {string} partName - Назва запчастини
     * @returns {Array|null} Масив виробників або null
     */
    getRecommendedManufacturers(partName) {
        return this.manufacturers[partName] || null;
    }

    /**
     * Отримує попередження для запчастини
     * @param {string} partName - Назва запчастини
     * @returns {string|null} Текст попередження або null
     */
    getWarningForPart(partName) {
        if (this.brakeParts.includes(partName)) {
            return "⚠️ ОБОВ'ЯЗКОВО спочатку заїхати на профілактику направляючих і перевірити стан гальмівної системи (товщину дисків гальмівних, залишок колодок гальмівних). Міняти запчастини ТІЛЬКИ ПІСЛЯ ДІАГНОСТИКИ І ТІЛЬКИ ЗА НЕОБХІДНОСТІ.";
        }

        if (this.suspensionParts.includes(partName)) {
            return "⚠️ ОБОВ'ЯЗКОВО спочатку зробити діагностику ходової частини. Міняти запчастини ТІЛЬКИ ПІСЛЯ ДІАГНОСТИКИ І ТІЛЬКИ ЗА НЕОБХІДНОСТІ.";
        }

        if (partName === 'Розвал-сходження 📐') {
            return "⚠️ ОБОВ'ЯЗКОВО спочатку зробити діагностику ходової частини.";
        }

        // Для робіт не показуємо попередження
        if (this.workParts.includes(partName)) {
            return null;
        }

        return null;
    }

    /**
     * Генерує прогноз обслуговування
     * @param {Object} car - Об'єкт автомобіля
     * @param {Function} findRegulationForCar - Функція пошуку регламенту
     * @param {Function} formatNumber - Функція форматування числа
     * @param {Object} partsForecast - Модуль прогнозу закупівель (опціонально)
     * @param {Array} maintenanceRegulations - Регламенти ТО
     * @returns {Array} Масив прогнозів
     */
    generateForecast(car, findRegulationForCar, formatNumber, partsForecast = null, maintenanceRegulations = []) {
        const forecasts = [];
        const now = new Date();

        // Перевіряємо чи потрібно приховати "Прожиг сажового фільтру"
        const carYear = parseInt(car.year) || 0;
        const carModel = (car.model || '').toUpperCase();
        const shouldHideSootBurn = carYear < 2010 || 
                                   carModel.includes('FIAT TIPO') || 
                                   carModel.includes('PEUGEOT 301') || 
                                   carModel.includes('HYUNDAI ACCENT');

        // Використовуємо новий алгоритм якщо доступний
        let useNewAlgorithm = false;
        if (partsForecast) {
            try {
                useNewAlgorithm = true;
                const forecastData = partsForecast.calculateForecast(
                    [car],
                    maintenanceRegulations,
                    findRegulationForCar,
                    6
                );

                Object.values(forecastData.byMonth).forEach(monthData => {
                    monthData.parts.forEach(need => {
                        // Пропускаємо "Прожиг сажового фільтру" якщо потрібно
                        if (shouldHideSootBurn && need.partName === 'Прожиг сажового фільтру 🔥') {
                            return;
                        }
                        let urgency = 'forecasted';
                        let when = '';

                        if (need.urgency === 'critical') {
                            urgency = 'critical';
                            when = 'Це лише прогноз, але бажано звернути увагу найближчим часом';
                        } else if (need.urgency === 'planned') {
                            urgency = 'warning';
                            if (need.monthsUntilReplacement !== null) {
                                const months = Math.ceil(need.monthsUntilReplacement);
                                if (months <= 1) {
                                    when = 'Через місяць';
                                } else {
                                    when = `Через ${months} місяці`;
                                }
                            } else {
                                when = 'Планове';
                            }
                        } else {
                            if (need.monthsUntilReplacement !== null) {
                                const months = Math.ceil(need.monthsUntilReplacement);
                                if (months <= 1) {
                                    when = 'Через місяць';
                                } else {
                                    when = `Через ${months} місяці`;
                                }
                            } else {
                                when = 'Планове';
                            }
                        }

                        const manufacturers = this.getRecommendedManufacturers(need.partName);
                        const warning = this.getWarningForPart(need.partName);

                        forecasts.push({
                            part: need.partName,
                            type: need.regulation.periodType === 'пробіг' ? 'пробіг' : 'час',
                            status: urgency,
                            when: when,
                            manufacturers: manufacturers,
                            warning: warning,
                            cost: need.totalCost
                        });
                    });
                });
            } catch (e) {
                console.warn('Помилка при використанні нового алгоритму в прогнозі:', e);
                useNewAlgorithm = false;
            }
        }

        // Якщо новий алгоритм не використовується, використовуємо старий
        if (!useNewAlgorithm) {
            // Старий алгоритм (збережений для fallback)
            for (const partName in car.parts) {
                const part = car.parts[partName];
                if (!part) continue;

                // Пропускаємо "Прожиг сажового фільтру" якщо потрібно
                if (shouldHideSootBurn && partName === 'Прожиг сажового фільтру 🔥') {
                    continue;
                }

                if (this.excludedParts.includes(partName)) continue;

                const isWork = this.workParts.includes(partName);

                if (isWork && (part.status === 'critical' || part.status === 'warning')) {
                    const manufacturers = this.getRecommendedManufacturers(partName);
                    const warning = this.getWarningForPart(partName);

                    forecasts.push({
                        part: partName,
                        type: 'статус',
                        status: part.status,
                                when: 'Це лише прогноз, але бажано звернути увагу найближчим часом',
                        manufacturers: manufacturers,
                        warning: warning
                    });
                    continue;
                }

                const regulation = findRegulationForCar(car.license, car.model, car.year, partName);

                if (regulation && regulation.normalValue !== 'chain') {
                    let nextMaintenance = null;
                    let isPast = false;

                    if (regulation.periodType === 'пробіг') {
                        const remainingKm = regulation.normalValue - part.mileageDiff;
                        isPast = remainingKm < 0;

                        if (remainingKm < 5000) {
                            if (isPast) {
                                if (part.status === 'critical') {
                                    nextMaintenance = {
                                        part: partName,
                                        type: 'пробіг',
                                        status: part.status,
                                        when: 'Через 2 тижні'
                                    };
                                } else if (part.status === 'warning') {
                                    nextMaintenance = {
                                        part: partName,
                                        type: 'пробіг',
                                        status: part.status,
                                        when: 'Через місяць'
                                    };
                                } else {
                                    nextMaintenance = {
                                        part: partName,
                                        type: 'пробіг',
                                        status: part.status,
                                        when: `через ${formatNumber(Math.max(0, remainingKm))} км`
                                    };
                                }
                            } else {
                                nextMaintenance = {
                                    part: partName,
                                    type: 'пробіг',
                                    status: part.status,
                                    when: `через ${formatNumber(Math.max(0, remainingKm))} км`
                                };
                            }
                        }
                    } else if (regulation.periodType === 'місяць') {
                        const remainingMonths = regulation.normalValue - Math.floor(part.daysDiff / 30);
                        isPast = remainingMonths < 0;

                        if (remainingMonths < 3) {
                            if (isPast) {
                                if (part.status === 'critical') {
                                    nextMaintenance = {
                                        part: partName,
                                        type: 'час',
                                        status: part.status,
                                        when: 'Через 2 тижні'
                                    };
                                } else if (part.status === 'warning') {
                                    nextMaintenance = {
                                        part: partName,
                                        type: 'час',
                                        status: part.status,
                                        when: 'Через місяць'
                                    };
                                } else {
                                    nextMaintenance = {
                                        part: partName,
                                        type: 'час',
                                        status: part.status,
                                        when: 'Згідно розрахунків'
                                    };
                                }
                            } else {
                                nextMaintenance = {
                                    part: partName,
                                    type: 'час',
                                    status: part.status,
                                    when: 'Згідно розрахунків'
                                };
                            }
                        }
                    }

                    if (nextMaintenance) {
                        const manufacturers = this.getRecommendedManufacturers(partName);
                        const warning = this.getWarningForPart(partName);
                        nextMaintenance.manufacturers = manufacturers;
                        nextMaintenance.warning = warning;
                        forecasts.push(nextMaintenance);
                    }
                }
            }
        }

        // Додаємо свічки запалювання для Peugeot/Hyundai/Fiat
        if (this.isCarWithSparkPlugs(car.model)) {
            const sparkPlugPart = car.parts['Свічки запалювання 🔥'];
            if (sparkPlugPart) {
                const regulation = findRegulationForCar(car.license, car.model, car.year, 'Свічки запалювання 🔥');
                if (regulation && regulation.normalValue !== 'chain') {
                    let nextMaintenance = null;

                    if (regulation.periodType === 'пробіг') {
                        const remainingKm = regulation.normalValue - sparkPlugPart.mileageDiff;
                        if (remainingKm < 10000) {
                            nextMaintenance = {
                                part: 'Свічки запалювання 🔥',
                                type: 'пробіг',
                                status: sparkPlugPart.status,
                                when: remainingKm < 0 ? 'Це лише прогноз, але бажано звернути увагу найближчим часом' : `через ${formatNumber(Math.max(0, remainingKm))} км`,
                                manufacturers: this.getRecommendedManufacturers('Свічки запалювання 🔥'),
                                warning: null
                            };
                        }
                    } else if (regulation.periodType === 'місяць') {
                        const remainingMonths = regulation.normalValue - Math.floor(sparkPlugPart.daysDiff / 30);
                        if (remainingMonths < 6) {
                            nextMaintenance = {
                                part: 'Свічки запалювання 🔥',
                                type: 'час',
                                status: sparkPlugPart.status,
                                when: remainingMonths < 0 ? 'Це лише прогноз, але бажано звернути увагу найближчим часом' : 'Згідно розрахунків',
                                manufacturers: this.getRecommendedManufacturers('Свічки запалювання 🔥'),
                                warning: null
                            };
                        }
                    }

                    if (nextMaintenance) {
                        forecasts.push(nextMaintenance);
                    }
                }
            }
        }

        // Сортуємо за терміновістю
        forecasts.sort((a, b) => {
            if (a.status === 'critical' && b.status !== 'critical') return -1;
            if (a.status !== 'critical' && b.status === 'critical') return 1;
            if (a.status === 'warning' && b.status !== 'warning') return -1;
            if (a.status !== 'warning' && b.status === 'warning') return 1;
            return (a.remaining || 0) - (b.remaining || 0);
        });

        return forecasts;
    }

    /**
     * Перевіряє чи авто потребує свічок запалювання
     * @param {string} model - Модель авто
     * @returns {boolean}
     */
    isCarWithSparkPlugs(model) {
        if (!model) return false;
        const modelUpper = model.toUpperCase();
        return /PEUGEOT|HYUNDAI|FIAT/.test(modelUpper);
    }

    /**
     * Генерує HTML для відображення прогнозу
     * @param {Array} forecasts - Масив прогнозів
     * @returns {string} HTML код
     */
    generateForecastHTML(forecasts) {
        if (forecasts.length === 0) {
            return '';
        }

        return `
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl shadow-xl p-3 sm:p-4 mb-4 border border-orange-200">
                <h3 class="text-lg font-bold text-orange-800 mb-3 flex items-center gap-2">
                    <span>⏰</span> Прогноз наступного обслуговування та можливих поломок
                </h3>
                <div class="space-y-2">
                    ${forecasts.map(forecast => {
                        const icon = forecast.type === 'пробіг' ? '🛣️' : 
                                    forecast.type === 'статус' ? (forecast.status === 'critical' ? '⛔' : '⚠️') :
                                    forecast.type === 'рекомендація' ? '💡' : '📅';
                        const statusColor = forecast.status === 'critical' ? 'text-red-600' : 
                                           forecast.status === 'warning' ? 'text-orange-600' : 'text-green-600';
                        
                        const manufacturersText = forecast.manufacturers ? 
                            ` <span class="text-xs text-gray-500">(рекомендовані виробники: ${forecast.manufacturers.join(', ')})</span>` : '';

                        return `
                            <div class="p-3 bg-white/70 rounded-lg">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center gap-2 flex-1">
                                        <span class="${statusColor} text-lg">${icon}</span>
                                        <span class="font-medium text-gray-800">
                                            ${forecast.part}${manufacturersText}
                                        </span>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-sm font-bold ${statusColor}">${forecast.when}</div>
                                    </div>
                                </div>
                                ${forecast.warning ? `
                                    <div class="mt-2 pt-2 border-t border-orange-200">
                                        <div class="text-xs text-orange-700">${forecast.warning}</div>
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

// Експортуємо для використання
window.MaintenanceForecast = MaintenanceForecast;
console.log('✅ Модуль прогнозу обслуговування завантажено');
