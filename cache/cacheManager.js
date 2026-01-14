/**
 * Менеджер кешування даних
 */

class CacheManager {
    /**
     * Отримує кешовані дані
     */
    static getCachedData() {
        try {
            const cached = localStorage.getItem('carAnalyticsData');
            if (!cached) return null;

            const data = JSON.parse(cached);
            const cacheTime = new Date(data.lastUpdated).getTime();
            const currentTime = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 години

            if (currentTime - cacheTime > maxAge) {
                console.log(`⚠️ Кеш застарів (${Math.floor((currentTime - cacheTime) / 1000 / 60 / 60)} годин)`);
                return null;
            }

            return data;
        } catch (error) {
            console.warn('⚠️ Помилка читання кешу:', error);
            return null;
        }
    }

    /**
     * Зберігає дані в кеш
     */
    static cacheData(data) {
        try {
            const dataString = JSON.stringify(data);
            localStorage.setItem('carAnalyticsData', dataString);
            localStorage.setItem('carAnalyticsCacheTime', new Date().toISOString());
            console.log('💾 Дані збережено в кеш');
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.warn('⚠️ Перевищено квоту localStorage. Спробуємо зберегти стиснуті дані...');
                try {
                    const compressedData = {
                        schedule: data.schedule,
                        regulations: data.regulations,
                        lastUpdate: data.lastUpdate,
                        history: []
                    };
                    const compressedString = JSON.stringify(compressedData);
                    localStorage.setItem('carAnalyticsData', compressedString);
                    localStorage.setItem('carAnalyticsCacheTime', new Date().toISOString());
                    console.log('💾 Збережено стиснуті дані (без історії)');
                } catch (compressedError) {
                    console.warn('⚠️ Не вдалося зберегти навіть стиснуті дані. Очищаємо старий кеш...');
                    try {
                        localStorage.removeItem('carAnalyticsData');
                        localStorage.removeItem('carAnalyticsCacheTime');
                        const minimalData = {
                            schedule: data.schedule,
                            regulations: data.regulations,
                            lastUpdate: data.lastUpdate
                        };
                        localStorage.setItem('carAnalyticsData', JSON.stringify(minimalData));
                        localStorage.setItem('carAnalyticsCacheTime', new Date().toISOString());
                        console.log('💾 Збережено мінімальні дані');
                    } catch (finalError) {
                        console.warn('⚠️ Неможливо зберегти дані в кеш. Продовжуємо без кешування.');
                    }
                }
            } else {
                console.warn('⚠️ Помилка збереження кешу:', error);
            }
        }
    }

    /**
     * Очищає кеш
     */
    static clearCache() {
        try {
            localStorage.removeItem('carAnalyticsData');
            localStorage.removeItem('carAnalyticsCacheTime');
            console.log('🗑️ Кеш очищено');
            return true;
        } catch (error) {
            console.error('❌ Помилка очищення кешу:', error);
            return false;
        }
    }

    /**
     * Оновлює інформацію про кеш
     */
    static updateCacheInfo() {
        try {
            const cacheTime = localStorage.getItem('carAnalyticsCacheTime');
            if (cacheTime) {
                const time = new Date(cacheTime);
                const now = new Date();
                const diffHours = Math.floor((now - time) / (1000 * 60 * 60));
                const diffMinutes = Math.floor((now - time) / (1000 * 60 * 60 * 1000)) % 60;
                console.log(`⏰ Кеш оновлено ${diffHours} годин ${diffMinutes} хвилин тому`);
            }
        } catch (error) {
            // Ігноруємо помилки
        }
    }
}

// Експортуємо для використання
window.CacheManager = CacheManager;
