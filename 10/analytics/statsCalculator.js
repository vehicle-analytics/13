/**
 * Калькулятор статистики та аналітики
 */

class StatsCalculator {
    /**
     * Розраховує health score для автомобіля
     */
    static calculateHealthScore(car) {
        let score = 100;
        const criticalParts = [];
        const warningParts = [];
        
        // Аналізуємо стан запчастин
        for (const partName in car.parts) {
            const part = car.parts[partName];
            if (part) {
                if (part.status === 'critical') {
                    criticalParts.push(partName);
                    score -= 4; // -4% за кожну критичну деталь
                } else if (part.status === 'warning') {
                    warningParts.push(partName);
                    score -= 2; // -2% за кожну деталь "Увага"
                }
            }
        }
        
        // Враховуємо вік авто
        if (car.year) {
            const carAge = new Date().getFullYear() - parseInt(car.year);
            if (carAge > 18) score -= 25; // Авто старше 18 років
            else if (carAge > 10) score -= 10; // Авто старше 10 років
            else if (carAge > 5) score -= 5; // Авто старше 5 років
        }
        
        // Враховуємо пробіг
        if (car.currentMileage > 500000) score -= 10; // Понад 500,000 км: -10%
        else if (car.currentMileage > 300000) score -= 5; // Понад 300,000 км: -5%
        else if (car.currentMileage > 200000) score -= 3; // Понад 200,000 км: -3%
        
        // Враховуємо стан з листа "Оцінка авто фото"
        if (car.photoAssessmentStatus) {
            const statusUpper = car.photoAssessmentStatus.toUpperCase().trim();
            if (statusUpper.includes('ВІДМІННИЙ')) {
                score += 10; // Відмінний – плюс 10
            } else if (statusUpper.includes('ДОБРИЙ')) {
                score += 3; // Добрий – плюс 3
            } else if (statusUpper.includes('ЗАДОВІЛЬНИЙ')) {
                score -= 5; // Задовільний – мінус 5
            } else if (statusUpper.includes('КРИТИЧНИЙ')) {
                score -= 26; // Критичний – мінус 26
            }
        }
        
        // Забезпечуємо мінімальне значення
        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Отримує колір для health score
     */
    static getHealthScoreColor(score) {
        if (score >= 86) return 'from-green-400 to-green-500';
        if (score >= 61) return 'from-blue-400 to-blue-500';
        if (score >= 41) return 'from-yellow-400 to-yellow-500';
        if (score >= 35) return 'from-orange-400 to-orange-500';
        return 'from-red-400 to-red-500';
    }
    
    /**
     * Отримує мітку для health score
     */
    static getHealthScoreLabel(score) {
        if (score >= 86) return 'Відмінний';
        if (score >= 61) return 'Добрий';
        if (score >= 41) return 'Задовільний';
        if (score < 35) return 'Критичний';
        return 'Поганий'; // Для діапазону 35-41%
    }
    
    /**
     * Отримує статус для health score
     */
    static getHealthScoreStatus(score) {
        if (score >= 86) return 'Відмінний';
        if (score >= 61) return 'Добрий';
        if (score >= 41) return 'Задовільний';
        if (score < 35) return 'Критичний';
        return 'Поганий'; // Для діапазону 35-41%
    }

    /**
     * Розраховує статистику по автомобілях
     */
    static calculateStats(cars, calculateHealthScore, getHealthScoreLabel) {
        let totalCars = 0;
        let carsWithGood = 0; // Відмінний + Добрий
        let carsWithWarning = 0; // Задовільний + Поганий
        let carsWithCritical = 0; // Критичний
        
        // Детальна статистика по станах
        let carsExcellent = 0; // Відмінний (≥86%)
        let carsGood = 0; // Добрий (61-85%)
        let carsSatisfactory = 0; // Задовільний (41-60%)
        let carsBad = 0; // Поганий (35-40%)
        let carsCritical = 0; // Критичний (<35%)

        for (const car of cars) {
            totalCars++;
            const healthScore = calculateHealthScore(car);
            const healthLabel = getHealthScoreLabel(healthScore);
            
            // Рахуємо детальну статистику
            if (healthScore >= 86) {
                carsExcellent++;
                carsWithGood++; // Відмінний входить в "У нормі"
            } else if (healthScore >= 61) {
                carsGood++;
                carsWithGood++; // Добрий входить в "У нормі"
            } else if (healthScore >= 41) {
                carsSatisfactory++;
                carsWithWarning++; // Задовільний входить в "Увага"
            } else if (healthScore >= 35) {
                carsBad++;
                carsWithWarning++; // Поганий входить в "Увага"
            } else {
                carsCritical++;
                carsWithCritical++; // Критичний
            }
        }

        return { 
            totalCars, 
            carsWithGood, 
            carsWithWarning, 
            carsWithCritical,
            carsExcellent,
            carsGood,
            carsSatisfactory,
            carsBad,
            carsCritical
        };
    }

    /**
     * Отримує список міст з автомобілів
     */
    static getCities(cars) {
        const cities = new Set();
        for (const car of cars) {
            if (car.city) cities.add(car.city);
        }
        const sortedCities = Array.from(cities).sort((a, b) => a.localeCompare(b, 'uk'));
        return ['Всі міста', ...sortedCities];
    }
}

// Експортуємо для використання
window.StatsCalculator = StatsCalculator;
