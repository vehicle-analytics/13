/**
 * 💡 Рекомендації та поради для автомобілів
 * Генерує рекомендації на основі стану запчастин та історії обслуговування
 */

class CarRecommendations {
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

        this.workParts = [
            'ТО (масло+фільтри) 🛢️',
            'Діагностика ходової 🔍',
            'Розвал-сходження 📐',
            'Профілактика направляючих супортів 🛠️',
            "Компютерна діагностика 💻",
            'Прожиг сажового фільтру 🔥'
        ];

        // Пріоритети рекомендацій (менше число = вищий пріоритет)
        this.recommendationPriorities = {
            'ГРМ (ролики+ремінь)': 1,
            'Помпа': 2,
            'Обвідний ремінь+ролики': 3,
            'ТО (масло+фільтри)': 4,
            'Профілактика направляючих супортів': 5,
            'Діагностика ходової': 6,
            'Розвал-сходження': 7,
            'Комп\'ютерна діагностика': 8,
            'Прожиг сажового фільтру': 9,
            'Помити автомобіль': 10
        };
    }

    /**
     * Отримує пріоритет рекомендації на основі тексту
     * @param {string} text - Текст рекомендації
     * @returns {number} Пріоритет (більше число = нижчий пріоритет)
     */
    getRecommendationPriority(text) {
        if (!text) return 99;
        
        const textUpper = text.toUpperCase();
        
        // Перевіряємо кожен пріоритет (менше число = вищий пріоритет)
        // 1. ГРМ (ролики+ремінь)
        if (textUpper.includes('ГРМ') || (textUpper.includes('РОЛИКИ') && textUpper.includes('РЕМІНЬ'))) return 1;
        
        // 2. Помпа
        if (textUpper.includes('ПОМПА')) return 2;
        
        // 3. Обвідний ремінь+ролики
        if (textUpper.includes('ОБВІДНИЙ РЕМІНЬ') || (textUpper.includes('ОБВІДНИЙ') && textUpper.includes('РЕМІНЬ'))) return 3;
        
        // 4. ТО (масло+фільтри)
        if (textUpper.includes('ТО') && (textUpper.includes('МАСЛО') || textUpper.includes('ФІЛЬТРИ'))) return 4;
        
        // 5. Профілактика направляючих супортів
        if (textUpper.includes('ПРОФІЛАКТИКА НАПРАВЛЯЮЧИХ СУПОРТІВ') || 
            (textUpper.includes('ПРОФІЛАКТИКА') && textUpper.includes('СУПОРТ'))) return 5;
        
        // 6. Діагностика ходової
        if (textUpper.includes('ДІАГНОСТИКА ХОДОВОЇ') || 
            (textUpper.includes('ДІАГНОСТИКА') && textUpper.includes('ХОДОВОЇ'))) return 6;
        
        // 7. Розвал-сходження
        if (textUpper.includes('РОЗВАЛ-СХОДЖЕННЯ') || textUpper.includes('РОЗВАЛ') || textUpper.includes('СХОДЖЕННЯ')) return 7;
        
        // 8. Комп'ютерна діагностика
        if (textUpper.includes('КОМП\'ЮТЕРНА ДІАГНОСТИКА') || 
            textUpper.includes('КОМПЮТЕРНА ДІАГНОСТИКА') ||
            (textUpper.includes('КОМП') && textUpper.includes('ДІАГНОСТИКА'))) return 8;
        
        // 9. Прожиг сажового фільтру
        if (textUpper.includes('ПРОЖИГ САЖОВОГО ФІЛЬТРУ') || 
            (textUpper.includes('ПРОЖИГ') && textUpper.includes('САЖОВОГО'))) return 9;
        
        // 10. Помити автомобіль
        if (textUpper.includes('ПОМИТИ АВТОМОБІЛЬ') || 
            textUpper.includes('МИЙКА') ||
            (textUpper.includes('ПОМИТИ') && textUpper.includes('АВТОМОБІЛЬ'))) return 10;
        
        return 99; // Інші рекомендації мають найнижчий пріоритет
    }

    /**
     * Генерує текст рекомендації для запчастин з часовими регламентами
     * @param {Object} config - Конфігурація рекомендації
     * @param {string} config.action - Необхідна дія (що робити)
     * @param {string} config.whenToDo - Коли виконати (термін)
     * @param {Object} config.regulation - Регламент (якщо є)
     * @param {string} config.benefit - Пізнавальна рекомендація і короткий опис (користь)
     * @returns {string} Сформований текст рекомендації
     */
    generateTimeBasedRecommendationText(config) {
        const { action, whenToDo, regulation, benefit } = config;
        
        let text = action;
        
        // Додаємо термін виконання
        if (whenToDo) {
            text += `. ${whenToDo}`;
        }
        
        // Додаємо рекомендацію як часто проводити (з регламенту)
        if (regulation && regulation.periodType && (regulation.periodType === 'місяць' || regulation.periodType === 'рік')) {
            const normalValue = regulation.normalValue;
            if (normalValue && normalValue !== 'chain' && normalValue !== null && normalValue !== undefined) {
                // Конвертуємо в число, якщо потрібно
                const numValue = typeof normalValue === 'number' ? normalValue : parseFloat(normalValue);
                
                if (!isNaN(numValue) && numValue > 0) {
                    if (regulation.periodType === 'місяць') {
                        const months = Math.round(numValue);
                        if (months === 1) {
                            text += '. Рекомендуємо проводити щомісяця';
                        } else if (months === 2) {
                            text += '. Рекомендуємо проводити кожні 2 місяці';
                        } else if (months === 3) {
                            text += '. Рекомендуємо проводити кожні 3 місяці';
                        } else if (months === 4) {
                            text += '. Рекомендуємо проводити кожні 4 місяці';
                        } else if (months === 5) {
                            text += '. Рекомендуємо проводити кожні 5 місяців';
                        } else if (months === 6) {
                            text += '. Рекомендуємо проводити кожні 6 місяців';
                        } else {
                            text += `. Рекомендуємо проводити кожні ${months} місяців`;
                        }
                    } else if (regulation.periodType === 'рік') {
                        const years = Math.round(numValue);
                        if (years === 1) {
                            text += '. Рекомендуємо проводити щороку';
                        } else if (years === 2) {
                            text += '. Рекомендуємо проводити кожні 2 роки';
                        } else {
                            text += `. Рекомендуємо проводити кожні ${years} роки`;
                        }
                    }
                }
            }
        }
        
        // Додаємо пізнавальну рекомендацію і короткий опис
        if (benefit) {
            text += `. ${benefit}`;
        }
        
        return text;
    }

    /**
     * Генерує рекомендації для автомобіля
     * @param {Object} car - Об'єкт автомобіля
     * @param {Object} costStats - Статистика витрат
     * @param {Function} getAverageMonthlyMileage - Функція отримання середнього місячного пробігу
     * @param {Function} formatMileage - Функція форматування пробігу
     * @param {Object} carWashChecker - Перевірка мийки авто
     * @param {Function} findRegulationForCar - Функція пошуку регламенту для авто
     * @param {Function} getNextReplacementInfo - Функція отримання інформації про наступну заміну
     * @returns {Array} Масив рекомендацій
     */
    generateRecommendations(car, costStats, getAverageMonthlyMileage, formatMileage, carWashChecker, findRegulationForCar, getNextReplacementInfo) {
        const recommendations = [];

        // Аналізуємо витрати
        if (costStats.averagePerMonth > 5000) {
            recommendations.push({
                icon: '⚠️',
                text: 'Високі щомісячні витрати. Рекомендуємо перевірити економічність авто.',
                type: 'warning',
                priority: 99
            });
        }

        // Перевіряємо чи є головні роботи
        const hasSuspensionWork = car.parts['Профілактика направляючих супортів 🛠️'] && 
                                 (car.parts['Профілактика направляючих супортів 🛠️'].status === 'critical' || 
                                  car.parts['Профілактика направляючих супортів 🛠️'].status === 'warning');
        
        const hasSuspensionDiagnostic = car.parts['Діагностика ходової 🔍'] && 
                                       (car.parts['Діагностика ходової 🔍'].status === 'critical' || 
                                        car.parts['Діагностика ходової 🔍'].status === 'warning');

        // Перевіряємо гальмівну систему
        let hasBrakeIssue = false;
        for (const partName of this.brakeParts) {
            const part = car.parts[partName];
            if (part && (part.status === 'critical' || part.status === 'warning')) {
                hasBrakeIssue = true;
                break;
            }
        }

        // Перевіряємо ходову частину
        let hasSuspensionIssue = false;
        for (const partName of this.suspensionParts) {
            const part = car.parts[partName];
            if (part && (part.status === 'critical' || part.status === 'warning')) {
                hasSuspensionIssue = true;
                break;
            }
        }

        // Перевіряємо чи "Діагностика ходової" має зелений статус (діагностика вже проведена)
        const suspensionDiagnosticPart = car.parts['Діагностика ходової 🔍'];
        const isSuspensionDiagnosticDone = suspensionDiagnosticPart && 
                                          suspensionDiagnosticPart.status !== 'critical' && 
                                          suspensionDiagnosticPart.status !== 'warning';

        // Перевіряємо роботи з червоним або помаранчевим статусом
        // Пропускаємо "Профілактика направляючих супортів" та "Діагностика ходової" якщо вони є головними
        for (const partName of this.workParts) {
            // Пропускаємо "Профілактика направляючих супортів" якщо вона є головною
            if (partName === 'Профілактика направляючих супортів 🛠️' && hasSuspensionWork) {
                continue;
            }
            // Пропускаємо "Діагностика ходової" якщо вона є головною
            if (partName === 'Діагностика ходової 🔍' && hasSuspensionDiagnostic) {
                continue;
            }
            
            const part = car.parts[partName];
            if (part && (part.status === 'critical' || part.status === 'warning')) {
                // Для ТО (масло+фільтри)
                if (partName === 'ТО (масло+фільтри) 🛢️') {
                    // Отримуємо інформацію про наступну заміну з регламенту
                    let nextReplacement = '';
                    if (getNextReplacementInfo) {
                        nextReplacement = getNextReplacementInfo(car, partName, part);
                    }
                    
                    // Отримуємо регламент для аналізу
                    let regulationInfo = '';
                    if (findRegulationForCar) {
                        const regulation = findRegulationForCar(car.license, car.model, car.year, partName);
                        if (regulation && regulation.normalValue && regulation.normalValue !== 'chain') {
                            regulationInfo = ` (регламент: ${formatMileage(regulation.normalValue)} км)`;
                        }
                    }
                    
                    recommendations.push({
                        icon: '🛢️',
                        text: `Необхідно провести 🛢️ ТО (масло+фільтри)${regulationInfo}. ${nextReplacement ? `${nextReplacement}. ` : ''}Допоможе підтримувати двигун у гарному стані. Рекомендовані виробники: MANN, KNECHT, MAHLE`,
                        type: part.status === 'critical' ? 'warning' : 'info',
                        priority: 4
                    });
                } else if (partName === 'Діагностика ходової 🔍') {
                    // Отримуємо інформацію про наступну перевірку з регламенту
                    let nextReplacement = '';
                    if (getNextReplacementInfo) {
                        nextReplacement = getNextReplacementInfo(car, partName, part);
                    }
                    
                    // Отримуємо регламент для аналізу
                    let regulation = null;
                    if (findRegulationForCar) {
                        regulation = findRegulationForCar(car.license, car.model, car.year, partName);
                    }
                    
                    const action = 'Необхідно провести Діагностику ходової (перевірка амортизаторів, опор, шарових опор, рульових тяг та наконечників, стабілізаторів)';
                    const whenToDo = nextReplacement || 'Виконати протягом тижня ⏳';
                    const benefit = 'Це забезпечить безпеку руху, комфорт під час їзди та допоможе виявити проблеми ходової частини на ранній стадії, що дозволить уникнути більш серйозних та дорогих ремонтів';
                    
                    const text = this.generateTimeBasedRecommendationText({
                        action,
                        whenToDo,
                        regulation,
                        benefit
                    });
                    
                    recommendations.push({
                        icon: '🔍',
                        text: text,
                        type: part.status === 'critical' ? 'warning' : 'info',
                        priority: 6
                    });
                } else if (partName === 'Розвал-сходження 📐') {
                    // Отримуємо інформацію про наступну перевірку з регламенту
                    let nextReplacement = '';
                    if (getNextReplacementInfo) {
                        nextReplacement = getNextReplacementInfo(car, partName, part);
                    }
                    
                    // Отримуємо регламент для аналізу
                    let regulation = null;
                    if (findRegulationForCar) {
                        regulation = findRegulationForCar(car.license, car.model, car.year, partName);
                    }
                    
                    const action = 'Необхідно провести Розвал-сходження (налаштування кутів установки коліс)';
                    const whenToDo = nextReplacement || 'Виконати протягом тижня ⏳';
                    const benefit = 'Рекомендується після перевірки ходової, якщо по ходовій немає зауважень. Покращує керованість автомобіля, зменшує знос шин та забезпечує рівномірний знос протектора, що продовжує термін служби шин';
                    
                    const text = this.generateTimeBasedRecommendationText({
                        action,
                        whenToDo,
                        regulation,
                        benefit
                    });
                    
                    recommendations.push({
                        icon: '📐',
                        text: text,
                        type: part.status === 'critical' ? 'warning' : 'info',
                        priority: 7
                    });
                } else if (partName === 'Профілактика направляючих супортів 🛠️') {
                    // Отримуємо інформацію про наступну перевірку з регламенту
                    let nextReplacement = '';
                    if (getNextReplacementInfo) {
                        nextReplacement = getNextReplacementInfo(car, partName, part);
                    }
                    
                    // Отримуємо регламент для аналізу
                    let regulation = null;
                    if (findRegulationForCar) {
                        regulation = findRegulationForCar(car.license, car.model, car.year, partName);
                    }
                    
                    const action = 'Необхідно провести Профілактику направляючих супортів (заміна направляючих, мащення, чистка) та перевірити стан гальмівної системи (товщину дисків гальмівних, залишок колодок гальмівних)';
                    const whenToDo = nextReplacement || 'Виконати протягом тижня ⏳';
                    const benefit = 'Це забезпечить рівномірну роботу гальм і продовжить ресурс супортів, гальмівних дисків і колодок. Регулярна профілактика запобігає заклинюванню супортів та забезпечує безпеку гальмування';
                    
                    const text = this.generateTimeBasedRecommendationText({
                        action,
                        whenToDo,
                        regulation,
                        benefit
                    });
                    
                    recommendations.push({
                        icon: '🛠️',
                        text: text,
                        type: part.status === 'critical' ? 'warning' : 'info',
                        priority: 5
                    });
                } else if (partName === "Компютерна діагностика 💻" || partName === "Комп'ютерна діагностика 💻") {
                    // Отримуємо інформацію про наступну перевірку з регламенту
                    let nextReplacement = '';
                    if (getNextReplacementInfo) {
                        nextReplacement = getNextReplacementInfo(car, partName, part);
                    }
                    
                    // Отримуємо регламент для аналізу
                    let regulation = null;
                    if (findRegulationForCar) {
                        regulation = findRegulationForCar(car.license, car.model, car.year, partName);
                    }
                    
                    const action = "Необхідно провести Комп'ютерну діагностику (перевірка електронних систем, сканування помилок)";
                    const whenToDo = nextReplacement || 'Виконати протягом тижня ⏳';
                    const benefit = 'Дозволяє виявити приховані помилки та попередити несправності електронних систем. Своєчасна діагностика допомагає уникнути дорогих ремонтів та забезпечує надійну роботу всіх систем автомобіля';
                    
                    const text = this.generateTimeBasedRecommendationText({
                        action,
                        whenToDo,
                        regulation,
                        benefit
                    });
                    
                    recommendations.push({
                        icon: '💻',
                        text: text,
                        type: part.status === 'critical' ? 'warning' : 'info',
                        priority: 8
                    });
                } else if (partName === 'Прожиг сажового фільтру 🔥') {
                    // Отримуємо інформацію про наступну перевірку з регламенту
                    let nextReplacement = '';
                    if (getNextReplacementInfo) {
                        nextReplacement = getNextReplacementInfo(car, partName, part);
                    }
                    
                    // Отримуємо регламент для аналізу
                    let regulation = null;
                    if (findRegulationForCar) {
                        regulation = findRegulationForCar(car.license, car.model, car.year, partName);
                    }
                    
                    const action = 'Необхідно провести Прожиг сажового фільтру (регенерація DPF фільтру)';
                    const whenToDo = nextReplacement || 'Виконати протягом тижня ⏳';
                    const benefit = 'Рекомендується для дизельних авто з фільтром DPF. Допомагає підтримувати ефективність та економічність двигуна, запобігає засміченню фільтру та знижує витрату палива';
                    
                    const text = this.generateTimeBasedRecommendationText({
                        action,
                        whenToDo,
                        regulation,
                        benefit
                    });
                    
                    recommendations.push({
                        icon: '🔥',
                        text: text,
                        type: part.status === 'critical' ? 'warning' : 'info',
                        priority: 9
                    });
                } else {
                    recommendations.push({
                        icon: '🔧',
                        text: `Необхідно провести: ${partName}`,
                        type: part.status === 'critical' ? 'warning' : 'info',
                        priority: 99
                    });
                }
            }
        }

        // Рекомендація для гальмівної системи (тільки якщо є "Профілактика направляючих супортів" або проблеми з гальмівними запчастинами)
        if (hasSuspensionWork) {
            // Якщо є "Профілактика направляючих супортів" - показуємо головну рекомендацію
            const prophylaxisPart = car.parts['Профілактика направляючих супортів 🛠️'];
            let nextReplacement = '';
            if (getNextReplacementInfo && prophylaxisPart) {
                nextReplacement = getNextReplacementInfo(car, 'Профілактика направляючих супортів 🛠️', prophylaxisPart);
            }
            
            let regulation = null;
            if (findRegulationForCar) {
                regulation = findRegulationForCar(car.license, car.model, car.year, 'Профілактика направляючих супортів 🛠️');
            }
            
            const action = 'Необхідно провести Профілактику направляючих супортів (заміна направляючих, мащення, чистка) та перевірити стан гальмівної системи (товщину дисків гальмівних, залишок колодок гальмівних)';
            const whenToDo = nextReplacement || 'Виконати протягом тижня ⏳';
            const benefit = 'Це забезпечить рівномірну роботу гальм і продовжить ресурс супортів, гальмівних дисків і колодок. Регулярна профілактика запобігає заклинюванню супортів та забезпечує безпеку гальмування';
            
            const text = this.generateTimeBasedRecommendationText({
                action,
                whenToDo,
                regulation,
                benefit
            });
            
            recommendations.push({
                icon: '🛠️',
                text: text,
                type: 'warning',
                priority: 5
            });
        } else if (hasBrakeIssue) {
            // Якщо немає "Профілактика направляючих супортів", але є проблеми з гальмівними запчастинами
            let regulation = null;
            if (findRegulationForCar) {
                regulation = findRegulationForCar(car.license, car.model, car.year, 'Профілактика направляючих супортів 🛠️');
            }
            
            const action = 'Необхідно провести Профілактику направляючих супортів (заміна направляючих, мащення, чистка) та перевірити стан гальмівної системи (товщину дисків гальмівних, залишок колодок гальмівних)';
            const whenToDo = 'Виконати протягом тижня ⏳';
            const benefit = 'Це забезпечить рівномірну роботу гальм і продовжить ресурс супортів, гальмівних дисків і колодок. Регулярна профілактика запобігає заклинюванню супортів та забезпечує безпеку гальмування';
            
            const text = this.generateTimeBasedRecommendationText({
                action,
                whenToDo,
                regulation,
                benefit
            });
            
            recommendations.push({
                icon: '🛠️',
                text: text,
                type: 'warning',
                priority: 5
            });
        }

        // Рекомендація для ходової частини
        // НЕ показуємо рекомендацію, якщо "Діагностика ходової" має зелений статус (діагностика вже проведена)
        if (!isSuspensionDiagnosticDone) {
            if (hasSuspensionDiagnostic) {
                // Якщо є "Діагностика ходової" з проблемним статусом - показуємо головну рекомендацію
                const diagnosticPart = car.parts['Діагностика ходової 🔍'];
                let nextReplacement = '';
                if (getNextReplacementInfo && diagnosticPart) {
                    nextReplacement = getNextReplacementInfo(car, 'Діагностика ходової 🔍', diagnosticPart);
                }
                
                let regulation = null;
                if (findRegulationForCar) {
                    regulation = findRegulationForCar(car.license, car.model, car.year, 'Діагностика ходової 🔍');
                }
                
                const action = 'Необхідно провести Діагностику ходової (перевірка амортизаторів, опор, шарових опор, рульових тяг та наконечників, стабілізаторів)';
                const whenToDo = nextReplacement || 'Виконати протягом тижня ⏳';
                const benefit = 'Це забезпечить безпеку руху, комфорт під час їзди та допоможе виявити проблеми ходової частини на ранній стадії, що дозволить уникнути більш серйозних та дорогих ремонтів';
                
                const text = this.generateTimeBasedRecommendationText({
                    action,
                    whenToDo,
                    regulation,
                    benefit
                });
                
                recommendations.push({
                    icon: '🔍',
                    text: text,
                    type: 'warning',
                    priority: 6
                });
            } else if (hasSuspensionIssue) {
                // Якщо немає "Діагностика ходової", але є проблеми з ходовою
                let regulation = null;
                if (findRegulationForCar) {
                    regulation = findRegulationForCar(car.license, car.model, car.year, 'Діагностика ходової 🔍');
                }
                
                const action = 'Необхідно провести Діагностику ходової (перевірка амортизаторів, опор, шарових опор, рульових тяг та наконечників, стабілізаторів)';
                const whenToDo = 'Виконати протягом тижня ⏳';
                const benefit = 'Це забезпечить безпеку руху, комфорт під час їзди та допоможе виявити проблеми ходової частини на ранній стадії, що дозволить уникнути більш серйозних та дорогих ремонтів';
                
                const text = this.generateTimeBasedRecommendationText({
                    action,
                    whenToDo,
                    regulation,
                    benefit
                });
                
                recommendations.push({
                    icon: '🔍',
                    text: text,
                    type: 'warning',
                    priority: 6
                });
            }
        }

        // Перевіряємо останнє ТО (якщо не вже додано в попередніх перевірках)
        const toPart = car.parts['ТО (масло+фільтри) 🛢️'];
        if (!toPart || (toPart.status !== 'critical' && toPart.status !== 'warning')) {
            const lastMaintenance = car.history.find(record => 
                record.description.toLowerCase().includes('масл') || 
                record.description.toLowerCase().includes('то')
            );

            if (lastMaintenance) {
                const lastMaintenanceDate = new Date(lastMaintenance.date);
                const monthsSince = (new Date() - lastMaintenanceDate) / (1000 * 60 * 60 * 24 * 30);

                if (monthsSince > 6) {
                    // Отримуємо регламент для аналізу
                    let regulationInfo = '';
                    if (findRegulationForCar) {
                        const regulation = findRegulationForCar(car.license, car.model, car.year, 'ТО (масло+фільтри) 🛢️');
                        if (regulation && regulation.normalValue && regulation.normalValue !== 'chain') {
                            regulationInfo = ` (регламент: ${formatMileage(regulation.normalValue)} км)`;
                        }
                    }
                    
                    recommendations.push({
                        icon: '🛢️',
                        text: `Необхідно провести 🛢️ ТО (масло+фільтри)${regulationInfo}. Допоможе підтримувати двигун у гарному стані. Рекомендовані виробники: MANN, KNECHT, MAHLE`,
                        type: 'warning',
                        priority: 4
                    });
                }
            }
        }

        // Перевіряємо мийку авто - виводимо тільки якщо мийки нема більше одного місяця
        if (carWashChecker) {
            const washCheck = carWashChecker.checkCarWash(car.history);
            if (washCheck.needsWash) {
                const washRecommendation = carWashChecker.generateRecommendation(washCheck);
                if (washRecommendation) {
                    washRecommendation.priority = 10; // Встановлюємо пріоритет для мийки
                    recommendations.push(washRecommendation);
                }
            }
        }

        // Перевіряємо свічки запалювання для Peugeot/Hyundai/Fiat
        if (this.isCarWithSparkPlugs(car.model)) {
            const sparkPlugPart = car.parts['Свічки запалювання 🔥'];
            if (sparkPlugPart && (sparkPlugPart.status === 'critical' || sparkPlugPart.status === 'warning')) {
                recommendations.push({
                    icon: '🔥',
                    text: 'Необхідно замінити свічки запалювання',
                    type: sparkPlugPart.status === 'critical' ? 'warning' : 'info',
                    priority: 99
                });
            }
        }

        // Перевіряємо ГРМ (ролики+ремінь) - пріоритет 1
        const grmPart = car.parts['ГРМ (ролики+ремінь) ⚙️'];
        if (grmPart) {
            // Перевіряємо, чи це авто з ланцюговим приводом ГРМ
            const chainDriveModels = ['mercedes-benz sprinter', 'iveco daily 65c15', 'isuzu nqr 71r', 'hyundai accent'];
            const isChainDriveGRM = car.model && chainDriveModels.some(model => car.model.toLowerCase().includes(model));
            
            if (!isChainDriveGRM && (grmPart.status === 'critical' || grmPart.status === 'warning')) {
                // Отримуємо інформацію про наступну заміну з регламенту
                let nextReplacement = '';
                if (getNextReplacementInfo) {
                    nextReplacement = getNextReplacementInfo(car, 'ГРМ (ролики+ремінь) ⚙️', grmPart);
                }
                
                // Отримуємо регламент для аналізу
                let regulationInfo = '';
                if (findRegulationForCar) {
                    const regulation = findRegulationForCar(car.license, car.model, car.year, 'ГРМ (ролики+ремінь) ⚙️');
                    if (regulation && regulation.normalValue && regulation.normalValue !== 'chain') {
                        regulationInfo = ` (регламент: ${formatMileage(regulation.normalValue)} км)`;
                    }
                }
                
                recommendations.push({
                    icon: '⚙️',
                    text: `Необхідно провести заміну ⚙️ ГРМ (ролики+ремінь)${regulationInfo}. ${nextReplacement ? `Наступна заміна: ${nextReplacement}. ` : ''}Своєчасна заміна захищає двигун від серйозних пошкоджень. Рекомендовані виробники: CONTINENTAL, INA, SKF`,
                    type: grmPart.status === 'critical' ? 'warning' : 'info',
                    priority: 1
                });
            }
        }

        // Перевіряємо Помпа - пріоритет 2
        const pumpPart = car.parts['Помпа 💧'];
        if (pumpPart && (pumpPart.status === 'critical' || pumpPart.status === 'warning')) {
            // Отримуємо інформацію про наступну заміну з регламенту
            let nextReplacement = '';
            if (getNextReplacementInfo) {
                nextReplacement = getNextReplacementInfo(car, 'Помпа 💧', pumpPart);
            }
            
            // Отримуємо регламент для аналізу
            let regulationInfo = '';
            if (findRegulationForCar) {
                const regulation = findRegulationForCar(car.license, car.model, car.year, 'Помпа 💧');
                if (regulation && regulation.normalValue && regulation.normalValue !== 'chain') {
                    regulationInfo = ` (регламент: ${formatMileage(regulation.normalValue)} км)`;
                }
            }
            
            recommendations.push({
                icon: '💧',
                text: `💧 Помпа - рекомендуємо контролювати роботу системи охолодження${regulationInfo}. ${nextReplacement ? `Наступна заміна: ${nextReplacement}. ` : ''}Справна помпа підтримує оптимальну температуру двигуна. Рекомендовані виробники: HEPU, GRAF, INA`,
                type: pumpPart.status === 'critical' ? 'warning' : 'info',
                priority: 2
            });
        }

        // Перевіряємо Обвідний ремінь+ролики - пріоритет 3
        const beltPart = car.parts['Обвідний ремінь+ролики 🔧'];
        if (beltPart && (beltPart.status === 'critical' || beltPart.status === 'warning')) {
            // Отримуємо інформацію про наступну заміну з регламенту
            let nextReplacement = '';
            if (getNextReplacementInfo) {
                nextReplacement = getNextReplacementInfo(car, 'Обвідний ремінь+ролики 🔧', beltPart);
            }
            
            // Отримуємо регламент для аналізу
            let regulationInfo = '';
            if (findRegulationForCar) {
                const regulation = findRegulationForCar(car.license, car.model, car.year, 'Обвідний ремінь+ролики 🔧');
                if (regulation && regulation.normalValue && regulation.normalValue !== 'chain') {
                    regulationInfo = ` (регламент: ${formatMileage(regulation.normalValue)} км)`;
                }
            }
            
            recommendations.push({
                icon: '🔧',
                text: `Необхідно перевірити 🔧 Обвідний ремінь+ролики та замінити${regulationInfo}. ${nextReplacement ? `Наступна заміна: ${nextReplacement}. ` : ''}Відповідає за стабільну роботу навісного обладнання. Рекомендовані виробники: CONTINENTAL, INA`,
                type: beltPart.status === 'critical' ? 'warning' : 'info',
                priority: 3
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                icon: '✅',
                text: 'Витрати в межах норми. Авто в хорошому стані.',
                type: 'success',
                priority: 99
            });
        }

        // Сортуємо рекомендації за пріоритетом (менше число = вищий пріоритет)
        // Спочатку встановлюємо пріоритет для всіх рекомендацій, якщо він не встановлений
        recommendations.forEach(rec => {
            if (rec.priority === undefined) {
                rec.priority = this.getRecommendationPriority(rec.text);
            }
        });
        
        // Сортуємо за пріоритетом
        recommendations.sort((a, b) => {
            const priorityA = a.priority || 99;
            const priorityB = b.priority || 99;
            return priorityA - priorityB;
        });

        return recommendations;
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
     * Форматує текст рекомендації, виділяючи назви робіт та терміни виконання
     * @param {string} text - Текст рекомендації
     * @returns {string} Відформатований HTML
     */
    formatRecommendationText(text) {
        if (!text) return '';
        
        // Список назв робіт для виділення
        const workNames = [
            'Діагностика ходової',
            'Розвал-сходження',
            'Профілактика направляючих супортів',
            'Комп\'ютерна діагностика',
            'Компютерна діагностика',
            'Прожиг сажового фільтру',
            'ТО (масло+фільтри)',
            'ГРМ (ролики+ремінь)',
            'Помпа',
            'Обвідний ремінь+ролики',
            'Свічки запалювання'
        ];
        
        let formattedText = text;
        
        // Виділяємо назви робіт жирним шрифтом
        workNames.forEach(workName => {
            const regex = new RegExp(`(${workName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            formattedText = formattedText.replace(regex, '<strong class="font-bold text-gray-900">$1</strong>');
        });
        
        // Виділяємо терміни виконання
        const timePatterns = [
            /(Виконати протягом тижня ⏳)/g,
            /(Наступна перевірка: [а-яіїєґА-ЯІЇЄҐ]+)/g,
            /(Наступна заміна: [^\.]+?)(?=\.|$)/g,
            /(Наступна заміна на [0-9\s]+ км)/g,
            /(Уже пора міняти 🤷‍♂️)/g
        ];
        
        timePatterns.forEach(pattern => {
            formattedText = formattedText.replace(pattern, '<strong class="font-bold text-blue-700">$1</strong>');
        });
        
        return formattedText;
    }

    /**
     * Форматує текст рекомендації для виділення назв робіт та термінів виконання
     * @param {string} text - Текст рекомендації
     * @returns {string} Відформатований HTML текст
     */
    formatRecommendationText(text) {
        if (!text) return '';
        
        let formatted = text;
        
        // Спочатку виділяємо терміни виконання (Виконати протягом тижня ⏳, Наступна перевірка: ...)
        formatted = formatted.replace(
            /(Виконати протягом тижня ⏳)/g,
            '<span class="font-bold text-blue-700">$1</span>'
        );
        
        formatted = formatted.replace(
            /(Наступна перевірка: [^\.]+?)(\.|$)/g,
            '<span class="font-bold text-blue-700">$1</span>$2'
        );
        
        formatted = formatted.replace(
            /(Наступна заміна: [^\.]+?)(\.|$)/g,
            '<span class="font-bold text-blue-700">$1</span>$2'
        );
        
        // Виділяємо назви робіт - перше речення (до першої крапки з пробілом після неї)
        // Шукаємо патерни типу "Необхідно провести ...", "Необхідна ...", "Необхідно замінити ..."
        // Використовуємо більш гнучкий підхід - знаходимо перше речення, що починається з "Необхідно" або "Необхідна"
        const firstSentenceMatch = formatted.match(/^((?:Необхідно|Необхідна)[^\.]+?)(\. )/);
        if (firstSentenceMatch) {
            formatted = formatted.replace(
                /^((?:Необхідно|Необхідна)[^\.]+?)(\. )/,
                '<span class="font-bold text-gray-900">$1</span>. '
            );
        }
        
        // Виділяємо "Рекомендуємо проводити ..."
        formatted = formatted.replace(
            /(Рекомендуємо проводити [^\.]+?)(\.|$)/g,
            '<span class="font-semibold text-indigo-700">$1</span>$2'
        );
        
        return formatted;
    }

    /**
     * Генерує HTML для відображення рекомендацій
     * @param {Array} recommendations - Масив рекомендацій
     * @returns {string} HTML код
     */
    generateRecommendationsHTML(recommendations) {
        return `
            <div class="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 class="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <span>💡</span> Необхідні дії, рекомендації та поради
                </h4>
                <div class="space-y-2">
                    ${recommendations.map(rec => {
                        // Прибираємо дублі емодзі з тексту, якщо воно вже є в icon
                        let text = rec.text || '';
                        if (rec.icon && text.includes(rec.icon)) {
                            text = text.replace(rec.icon, '').trim();
                        }
                        
                        // Форматуємо текст для виділення назв робіт та термінів
                        const formattedText = this.formatRecommendationText(text);
                        
                        return `
                        <div class="flex items-start gap-2 p-2 bg-white/50 rounded">
                            <span class="text-lg">${rec.icon}</span>
                            <span class="text-sm text-gray-700">${formattedText}</span>
                        </div>
                    `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}

// Експортуємо для використання
window.CarRecommendations = CarRecommendations;
console.log('✅ Модуль рекомендацій для авто завантажено');
