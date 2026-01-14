/**
 * Утиліти для форматування та парсингу даних
 */

class Formatters {
    /**
     * Парсить число з різних форматів
     */
    static parseNumber(value) {
        if (value === null || value === undefined || value === '') {
            return 0;
        }
        
        if (typeof value === 'number') {
            return isNaN(value) ? 0 : value;
        }
        
        const cleanStr = String(value)
            .trim()
            .replace(/\s+/g, '')
            .replace(/,/g, '.');
        
        if (cleanStr.toLowerCase() === 'ланцюг') {
            return 'chain';
        }
        
        const parsed = parseFloat(cleanStr);
        return isNaN(parsed) ? 0 : parsed;
    }

    /**
     * Конвертує значення в тисячі (якщо потрібно)
     */
    static convertToThousands(value) {
        if (value === null || value === undefined || isNaN(value)) {
            return 0;
        }
        return value;
    }

    /**
     * Форматує число з пробілами для тисяч
     */
    static formatNumber(number) {
        if (number === null || number === undefined || isNaN(number)) {
            return '-';
        }
        const roundedNumber = Math.round(number);
        return roundedNumber.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    /**
     * Форматує пробіг
     */
    static formatMileage(mileage) {
        if (mileage === null || mileage === undefined || isNaN(mileage)) {
            return '- км';
        }
        const convertedMileage = this.convertToThousands(mileage);
        const formatted = this.formatNumber(convertedMileage);
        return `${formatted} км`;
    }

    /**
     * Отримує оригінальний пробіг
     */
    static getOriginalMileage(mileage) {
        if (mileage === null || mileage === undefined || isNaN(mileage)) {
            return 0;
        }
        return this.convertToThousands(mileage);
    }

    /**
     * Форматує різницю пробігу
     */
    static formatMileageDiff(mileageDiff) {
        if (mileageDiff === null || mileageDiff === undefined || isNaN(mileageDiff)) {
            return '- км';
        }
        const formatted = this.formatNumber(mileageDiff);
        return `${formatted} км`;
    }

    /**
     * Форматує ціну
     */
    static formatPrice(price) {
        if (price === null || price === undefined || isNaN(price) || price === 0) {
            return '';
        }
        
        const rounded = Math.round(price * 100) / 100;
        const parts = rounded.toFixed(2).split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        
        return parts.join('.');
    }

    /**
     * Форматує дату в формат DD.MM.YYYY
     */
    static formatDate(dateString) {
        if (!dateString) return '';

        // Якщо дата вже в форматі DD.MM.YYYY, повертаємо як є
        if (typeof dateString === 'string' && dateString.includes('.')) {
            const parts = dateString.split('.');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                if (day && month && year && year.length === 4) {
                    return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
                }
            }
            return dateString;
        }

        // Якщо дата в форматі YYYY-MM-DD (ISO)
        if (typeof dateString === 'string' && dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                const [year, month, day] = parts;
                return `${day.padStart(2, '0')}.${month.padStart(2, '0')}.${year}`;
            }
        }

        // Спробуємо розпарсити як Date об'єкт
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        }

        return String(dateString);
    }

    /**
     * Парсить дату з різних форматів
     */
    static parseDate(dateString) {
        if (!dateString) return null;

        // Спочатку намагаємося парсити DD.MM.YYYY формат (найпоширеніший)
        const dotParts = String(dateString).split('.');
        if (dotParts.length === 3) {
            const day = parseInt(dotParts[0], 10);
            const month = parseInt(dotParts[1], 10);
            const year = parseInt(dotParts[2], 10);
            
            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
                day >= 1 && day <= 31 && month >= 1 && month <= 12 && year > 0) {
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime()) && 
                    date.getDate() === day && 
                    date.getMonth() === month - 1 && 
                    date.getFullYear() === year) {
                    return date;
                }
            }
        }

        // Потім намагаємося парсити YYYY-MM-DD формат
        const dashParts = String(dateString).split('-');
        if (dashParts.length === 3) {
            const year = parseInt(dashParts[0], 10);
            const month = parseInt(dashParts[1], 10);
            const day = parseInt(dashParts[2], 10);
            
            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && 
                day >= 1 && day <= 31 && month >= 1 && month <= 12 && year > 0) {
                const date = new Date(year, month - 1, day);
                if (!isNaN(date.getTime()) && 
                    date.getDate() === day && 
                    date.getMonth() === month - 1 && 
                    date.getFullYear() === year) {
                    return date;
                }
            }
        }

        // Якщо нічого не спрацювало, спробуємо стандартний парсер
        try {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date;
            }
        } catch (e) {
            // Ігноруємо помилки
        }

        return null;
    }
}

// Експортуємо для використання
window.Formatters = Formatters;
