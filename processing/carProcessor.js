/**
 * Обробка даних автомобілів та запчастин
 */

class CarProcessor {
    /**
     * Обробляє дані автомобілів
     */
    static processCarData(appData, getPartStatus, findRegulationForCar) {
        if (!appData) return [];

        const { records, carsInfo, currentMileages, partKeywords, partsOrder, currentDate, photoAssessmentStatuses } = appData;
        const cars = {};

        for (const license in carsInfo) {
            const carInfo = carsInfo[license];
            cars[license] = {
                city: carInfo.city,
                car: license,
                license: license,
                model: carInfo.model,
                year: carInfo.year,
                currentMileage: currentMileages[license] || 0,
                parts: {},
                history: [],
                photoAssessmentStatus: photoAssessmentStatuses && photoAssessmentStatuses[license] ? photoAssessmentStatuses[license] : null
            };

            for (const partName of partsOrder) {
                cars[license].parts[partName] = null;
            }
        }

        for (const record of records) {
            const car = cars[record.car];
            if (!car) continue;

            car.history.push(record);

            const descLower = record.description.toLowerCase();
            for (const partName in partKeywords) {
                const keywords = partKeywords[partName];
                let matched = false;
                
                for (const keyword of keywords) {
                    if (descLower.includes(keyword.toLowerCase())) {
                        matched = true;
                        break;
                    }
                }
                
                if (matched) {
                    const existingPart = car.parts[partName];
                    
                    // Використовуємо глобальний Formatters для парсингу дат
                    const parseDateFunc = (window.Formatters && window.Formatters.parseDate) || 
                        ((dateString) => {
                            if (!dateString) return null;
                            const date = new Date(dateString);
                            return !isNaN(date.getTime()) ? date : null;
                        });
                    
                    const recordDate = parseDateFunc(record.date);
                    if (!recordDate) {
                        continue;
                    }
                    
                    // Визначаємо, чи потрібно оновити запчастину
                    // Оновлюємо якщо: немає існуючої, або більший пробіг, або той самий пробіг але пізніша дата
                    let shouldUpdate = false;
                    if (!existingPart) {
                        shouldUpdate = true;
                    } else {
                        const existingDate = parseDateFunc(existingPart.date);
                        if (record.mileage > existingPart.mileage) {
                            shouldUpdate = true;
                        } else if (record.mileage === existingPart.mileage && existingDate && recordDate > existingDate) {
                            shouldUpdate = true;
                        }
                    }
                    
                    if (shouldUpdate) {
                        const mileageDiff = car.currentMileage - record.mileage;
                        
                        // Завжди використовуємо поточну дату для розрахунку часу, що минув
                        const currentDateObj = new Date();
                        currentDateObj.setHours(0, 0, 0, 0);
                        
                        // Нормалізуємо recordDate до початку дня для точного розрахунку
                        const normalizedRecordDate = new Date(recordDate);
                        normalizedRecordDate.setHours(0, 0, 0, 0);
                        
                        const daysDiff = Math.floor((currentDateObj - normalizedRecordDate) / (1000 * 60 * 60 * 24));
                        
                        if (isNaN(daysDiff) || daysDiff < 0) {
                            continue;
                        }
                        
                        const carYear = parseInt(car.year) || 0;
                        const carModel = car.model || '';

                        // Точніший розрахунок років і місяців на основі реальних дат
                        let years = 0;
                        let months = 0;
                        
                        // Використовуємо нормалізовані дати для точного розрахунку
                        const startDate = new Date(normalizedRecordDate);
                        const endDate = new Date(currentDateObj);
                        
                        // Розраховуємо роки
                        years = endDate.getFullYear() - startDate.getFullYear();
                        let monthDiff = endDate.getMonth() - startDate.getMonth();
                        
                        // Корекція якщо місяць ще не настав
                        if (monthDiff < 0) {
                            years--;
                            monthDiff += 12;
                        }
                        
                        // Корекція якщо день ще не настав
                        if (monthDiff === 0 && endDate.getDate() < startDate.getDate()) {
                            years--;
                            monthDiff = 11;
                        } else if (endDate.getDate() < startDate.getDate()) {
                            monthDiff--;
                            if (monthDiff < 0) {
                                monthDiff += 12;
                                years--;
                            }
                        }
                        
                        months = monthDiff;
                        
                        // Якщо років більше 0, не показуємо місяці окремо (вони вже враховані)
                        let timeDiff = '';

                        if (years > 0) {
                            timeDiff = years + 'р';
                            if (months > 0) {
                                timeDiff += ' ' + months + 'міс';
                            }
                        } else if (months > 0) {
                            timeDiff = months + 'міс';
                        } else if (daysDiff >= 0) {
                            timeDiff = daysDiff + 'дн';
                        } else {
                            timeDiff = '0дн';
                        }

                        car.parts[partName] = {
                            date: record.date,
                            mileage: record.mileage,
                            currentMileage: car.currentMileage,
                            mileageDiff: mileageDiff,
                            timeDiff: timeDiff,
                            daysDiff: daysDiff,
                            status: getPartStatus(partName, mileageDiff, daysDiff, carYear, carModel, car.license)
                        };
                    }
                }
            }
        }

        const sortedCars = Object.values(cars);
        sortedCars.sort((a, b) => {
            const cityCompare = (a.city || '').localeCompare(b.city || '', 'uk');
            return cityCompare !== 0 ? cityCompare : (a.license || '').localeCompare(b.license || '', 'uk');
        });

        for (const car of sortedCars) {
            car.history.sort((a, b) => {
                const parseDateFunc = (window.Formatters && window.Formatters.parseDate) || 
                    ((dateString) => {
                        if (!dateString) return null;
                        const date = new Date(dateString);
                        return !isNaN(date.getTime()) ? date : null;
                    });
                const dateA = parseDateFunc(a.date) || new Date(0);
                const dateB = parseDateFunc(b.date) || new Date(0);
                return dateB - dateA;
            });
        }

        return sortedCars;
    }

    /**
     * Знаходить регламент для конкретного автомобіля
     */
    static findRegulationForCar(license, model, year, partName, maintenanceRegulations) {
        if (!maintenanceRegulations || maintenanceRegulations.length === 0) {
            return null;
        }

        const carYear = parseInt(year) || 0;
        
        const mappedPartName = (CONSTANTS.PARTS_MAPPING && CONSTANTS.PARTS_MAPPING[partName]) || partName;
        
        const matchingRegulations = [];
        
        for (const regulation of maintenanceRegulations) {
            if (regulation.partName !== mappedPartName) continue;
            
            if (regulation.licensePattern !== '*' && regulation.licensePattern !== '.*') {
                if (regulation.licensePattern !== license) continue;
            }
            
            if (regulation.brandPattern !== '*' && regulation.brandPattern !== '.*') {
                try {
                    const brandRegex = new RegExp(regulation.brandPattern, 'i');
                    if (!brandRegex.test(model)) continue;
                } catch (e) {
                    console.warn('Помилка в регулярному виразі для марки:', regulation.brandPattern, e);
                    continue;
                }
            }
            
            if (regulation.modelPattern !== '*' && regulation.modelPattern !== '.*') {
                try {
                    const modelRegex = new RegExp(regulation.modelPattern, 'i');
                    if (!modelRegex.test(model)) continue;
                } catch (e) {
                    console.warn('Помилка в регулярному виразі для моделі:', regulation.modelPattern, e);
                    continue;
                }
            }
            
            if (carYear < regulation.yearFrom || carYear > regulation.yearTo) continue;
            
            matchingRegulations.push(regulation);
        }
        
        if (matchingRegulations.length === 0) {
            return null;
        }
        
        matchingRegulations.sort((a, b) => {
            const priorityA = (a.priority !== undefined && a.priority !== null) ? a.priority : 2;
            const priorityB = (b.priority !== undefined && b.priority !== null) ? b.priority : 2;
            return priorityA - priorityB;
        });
        
        if (window.CONFIG && window.CONFIG.DEBUG && matchingRegulations.length > 1) {
            console.log(`Знайдено ${matchingRegulations.length} регламентів для ${license} ${model} ${partName}:`, 
                matchingRegulations.map(r => ({
                    license: r.licensePattern,
                    brand: r.brandPattern,
                    model: r.modelPattern,
                    priority: r.priority,
                    normalValue: r.normalValue
                })));
        }
        
        return matchingRegulations[0];
    }

    /**
     * Визначає статус запчастини
     */
    static getPartStatus(partName, mileageDiff, daysDiff, carYear, carModel, license, maintenanceRegulations, findRegulationForCar) {
        const monthsDiff = daysDiff / 30;
        const yearsDiff = daysDiff / 365;
        
        const regulation = findRegulationForCar(license, carModel, carYear, partName, maintenanceRegulations);
        
        if (regulation) {
            if (regulation.normalValue === 'chain') {
                return 'good';
            }
            
            let currentValue;
            if (regulation.periodType === 'місяць') {
                currentValue = monthsDiff;
            } else if (regulation.periodType === 'рік') {
                currentValue = yearsDiff;
            } else {
                currentValue = mileageDiff;
            }
            
            if (regulation.criticalValue && currentValue >= regulation.criticalValue) return 'critical';
            if (regulation.warningValue && currentValue >= regulation.warningValue) return 'warning';
            if (regulation.normalValue !== undefined && regulation.normalValue !== null) return 'good';
        }
        
        return this.getPartStatusLegacy(partName, mileageDiff, daysDiff, carYear, carModel);
    }

    /**
     * Старий алгоритм визначення статусу (fallback)
     */
    static getPartStatusLegacy(partName, mileageDiff, daysDiff, carYear, carModel) {
        const monthsDiff = daysDiff / 30;
        const isMercedesSprinter = carModel && carModel.toLowerCase().includes('mercedes') && carModel.toLowerCase().includes('sprinter');

        if (isMercedesSprinter) {
            if (partName === 'ГРМ (ролики+ремінь) ⚙️') {
                return 'good';
            }
            if (partName === 'Помпа 💧') {
                if (mileageDiff >= 120000) return 'warning';
                return 'good';
            }
        }

        switch(partName) {
            case 'ТО (масло+фільтри) 🛢️':
                if (carYear && carYear >= 2010) {
                    if (mileageDiff >= 15500) return 'critical';
                    if (mileageDiff >= 14000) return 'warning';
                    return 'good';
                } else {
                    if (mileageDiff >= 10500) return 'critical';
                    if (mileageDiff >= 9000) return 'warning';
                    return 'good';
                }
            case 'ГРМ (ролики+ремінь) ⚙️': case 'Обвідний ремінь+ролики 🔧':
                if (mileageDiff >= 60500) return 'critical';
                if (mileageDiff >= 58000) return 'warning';
                return 'good';
            case 'Помпа 💧': case 'Зчеплення ⚙️': case 'Стартер 🔋': case 'Генератор ⚡':
                if (mileageDiff >= 120000) return 'critical';
                if (mileageDiff >= 80000) return 'warning';
                return 'good';
            case 'Діагностика ходової 🔍':
                if (monthsDiff > 3) return 'critical';
                if (monthsDiff >= 2) return 'warning';
                return 'good';
            case 'Розвал-сходження 📐': case 'Профілактика направляючих супортів 🛠️': case "Компютерна діагностика 💻": case 'Прожиг сажового фільтру 🔥':
                if (monthsDiff > 4) return 'critical';
                if (monthsDiff >= 2) return 'warning';
                return 'good';
            case 'Гальмівні колодки 🛑':
                if (mileageDiff > 80000) return 'critical';
                if (mileageDiff >= 60000) return 'warning';
                return 'good';
            case 'Гальмівні диски 💿': case 'Амортизатори 🔧':
                if (mileageDiff > 100000) return 'critical';
                if (mileageDiff >= 70000) return 'warning';
                return 'good';
            case 'Опора амортизаторів 🛠️': case 'Шарова опора ⚪': case 'Рульова тяга 🔗': case 'Рульовий накінечник 🔩':
                if (mileageDiff > 60000) return 'critical';
                if (mileageDiff >= 50000) return 'warning';
                return 'good';
            case 'Акумулятор 🔋':
                const yearsDiff = daysDiff / 365;
                if (yearsDiff > 4) return 'critical';
                if (yearsDiff >= 3) return 'warning';
                return 'good';
            default:
                if (mileageDiff > 50000) return 'critical';
                if (mileageDiff > 30000) return 'warning';
                return 'good';
        }
    }
}

// Експортуємо для використання
window.CarProcessor = CarProcessor;
