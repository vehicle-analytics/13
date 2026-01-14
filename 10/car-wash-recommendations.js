/**
 * 🧼 Рекомендації щодо мийки авто
 * Перевіряє чи була мийка авто за останній місяць
 */

class CarWashRecommendations {
    constructor() {
        // Ключові слова для визначення мийки
        this.washKeywords = ['мийка', 'мойка', 'автомойка', 'автомийка'];
    }

    /**
     * Перевіряє чи була мийка авто за останній місяць
     * @param {Array} history - Історія обслуговування авто
     * @returns {Object} Результат перевірки
     */
    checkCarWash(history) {
        const now = new Date();
        const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        // Шукаємо записи про мийку
        const washRecords = history.filter(record => {
            if (!record.description) return false;
            
            const descLower = record.description.toLowerCase();
            return this.washKeywords.some(keyword => descLower.includes(keyword));
        });

        // Сортуємо за датою (найновіші спочатку)
        washRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        const lastWash = washRecords.length > 0 ? washRecords[0] : null;
        
        let needsWash = false;
        let daysSinceWash = null;
        let recommendation = null;

        if (lastWash) {
            const lastWashDate = new Date(lastWash.date);
            daysSinceWash = Math.floor((now - lastWashDate) / (1000 * 60 * 60 * 24));
            
            // Якщо минуло більше місяця
            if (lastWashDate < oneMonthAgo) {
                needsWash = true;
                recommendation = 'Помити автомобіль, поприбирати в салоні авто';
            }
        } else {
            // Якщо немає записів про мийку взагалі
            needsWash = true;
            recommendation = 'Помити автомобіль, поприбирати в салоні авто';
        }

        return {
            needsWash,
            lastWash,
            daysSinceWash,
            recommendation,
            washRecordsCount: washRecords.length
        };
    }

    /**
     * Генерує рекомендацію для відображення
     * @param {Object} washCheck - Результат checkCarWash
     * @returns {Object|null} Об'єкт рекомендації або null
     */
    generateRecommendation(washCheck) {
        if (!washCheck.needsWash || !washCheck.recommendation) {
            return null;
        }

        return {
            icon: '🧼',
            text: '🧼 Помити автомобіль, поприбирати в салоні авто. Миття кузова допоможе зберегти покриття та захистити від корозії. Прибирання салону радимо проводити щоденно для чистоти, комфорту та приємної атмосфери в авто',
            type: 'info',
            priority: 3 // Нижчий пріоритет ніж критичні поломки
        };
    }
}

// Експортуємо для використання
window.CarWashRecommendations = CarWashRecommendations;
console.log('✅ Модуль рекомендацій щодо мийки авто завантажено');
