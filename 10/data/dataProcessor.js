/**
 * Обробка даних з Google Sheets
 */

class DataProcessor {
    /**
     * Обробляє дані з аркушів
     */
    static processData(scheduleData, historyData, regulationsData, photoAssessmentData, parseNumber, parseDate, formatDate) {
        console.log('🔧 Обробка даних...');

        if (!scheduleData || !historyData) {
            throw new Error('Немає даних для обробки');
        }

        const maintenanceRegulations = this.processRegulations(regulationsData, parseNumber);
        
        // Обробка даних з листа "Оцінка авто фото"
        const photoAssessmentStatuses = {};
        if (photoAssessmentData && photoAssessmentData.length > 1) {
            for (let i = 1; i < photoAssessmentData.length; i++) {
                const row = photoAssessmentData[i];
                if (row.length < 8) continue;
                
                const license = String(row[4] || '').trim();
                if (license) {
                    const status = String(row[7] || '').trim();
                    if (status) {
                        photoAssessmentStatuses[license] = status;
                    }
                }
            }
            console.log('✅ Завантажено станів з фото оцінки:', Object.keys(photoAssessmentStatuses).length);
        }

        const carsInfo = {};
        const carCities = {};

        // Рядок 1 (індекс 0): заголовки
        // Рядок 2 (індекс 1): пропускаємо
        // Рядок 3 (індекс 2): початок даних авто
        for (let i = 2; i < scheduleData.length; i++) {
            const row = scheduleData[i];
            if (row.length < 5) continue;

            const license = String(row[CONSTANTS.SCHEDULE_COL_LICENSE] || '').trim();
            if (license) {
                const city = String(row[CONSTANTS.SCHEDULE_COL_CITY] || '').trim();
                carsInfo[license] = {
                    city: city,
                    license: license,
                    model: String(row[CONSTANTS.SCHEDULE_COL_MODEL] || '').trim(),
                    year: String(row[CONSTANTS.SCHEDULE_COL_YEAR] || '').trim()
                };
                carCities[license] = city;
            }
        }

        const allowedCars = Object.keys(carsInfo);
        const records = [];
        const currentMileages = {};
        const allowedCarsSet = new Set(allowedCars);

        for (let i = 1; i < historyData.length; i++) {
            const row = historyData[i];
            if (row.length < 8) continue;

            const car = String(row[CONSTANTS.COL_CAR] || '').trim();
            if (!car || !allowedCarsSet.has(car)) continue;

            const mileageStr = String(row[CONSTANTS.COL_MILEAGE] || '').trim();
            let mileage = 0;

            if (mileageStr) {
                const cleanStr = mileageStr.replace(/[\s,]/g, '');
                mileage = parseFloat(cleanStr);
                if (isNaN(mileage)) continue;
                // Конвертація в тисячі (якщо потрібно)
                mileage = mileage;
            }

            if (mileage === 0) continue;

            // Використовуємо дату зі стовпчика J (COL_DATE_NEEDED) якщо вона є, інакше з COL_DATE
            let date = row.length > CONSTANTS.COL_DATE_NEEDED && row[CONSTANTS.COL_DATE_NEEDED] ? row[CONSTANTS.COL_DATE_NEEDED] : row[CONSTANTS.COL_DATE];
            if (date) {
                const originalDate = String(date).trim();
                
                if (originalDate.includes('.')) {
                    const parts = originalDate.split('.');
                    if (parts.length === 3 && parts[2] && parts[2].length === 4) {
                        date = originalDate;
                    } else {
                        const dateObj = parseDate(originalDate);
                        if (dateObj) {
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const year = dateObj.getFullYear();
                            date = `${day}.${month}.${year}`;
                        } else {
                            date = originalDate;
                        }
                    }
                } else {
                    const dateObj = parseDate(originalDate);
                    if (dateObj) {
                        const day = String(dateObj.getDate()).padStart(2, '0');
                        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                        const year = dateObj.getFullYear();
                        date = `${day}.${month}.${year}`;
                    } else {
                        date = originalDate;
                    }
                }
            }

            const city = carCities[car] || '';

            const quantity = row.length > CONSTANTS.COL_QUANTITY ? parseNumber(row[CONSTANTS.COL_QUANTITY]) : 0;
            const price = row.length > CONSTANTS.COL_PRICE ? parseNumber(row[CONSTANTS.COL_PRICE]) : 0;
            const totalWithVAT = row.length > CONSTANTS.COL_TOTAL_WITH_VAT ? parseNumber(row[CONSTANTS.COL_TOTAL_WITH_VAT]) : 0;

            records.push({
                date: date || '',
                city: city,
                car: car,
                mileage: mileage,
                originalMileage: mileageStr,
                description: String(row[CONSTANTS.COL_DESCRIPTION] || ''),
                partCode: row.length > CONSTANTS.COL_PART_CODE ? String(row[CONSTANTS.COL_PART_CODE] || '').trim() : '',
                unit: row.length > CONSTANTS.COL_UNIT ? String(row[CONSTANTS.COL_UNIT] || '').trim() : '',
                quantity: quantity,
                price: price,
                totalWithVAT: totalWithVAT,
                status: row.length > CONSTANTS.COL_STATUS ? String(row[CONSTANTS.COL_STATUS] || '').trim() : ''
            });

            if (mileage > (currentMileages[car] || 0)) {
                currentMileages[car] = mileage;
            }
        }

        const appData = {
            records: records,
            currentMileages: currentMileages,
            carsInfo: carsInfo,
            partKeywords: CONSTANTS.PARTS_CONFIG,
            partsOrder: CONSTANTS.PARTS_ORDER,
            regulations: maintenanceRegulations,
            photoAssessmentStatuses: photoAssessmentStatuses,
            currentDate: new Date().toISOString().split('T')[0],
            lastUpdated: new Date().toISOString(),
            _meta: {
                totalCars: allowedCars.length,
                totalRecords: records.length,
                processingTime: Date.now()
            }
        };

        document.getElementById('cars-count').textContent = allowedCars.length;

        return { appData, maintenanceRegulations };
    }

    /**
     * Обробляє регламенти обслуговування
     */
    static processRegulations(regulationsData, parseNumber) {
        if (!regulationsData || regulationsData.length <= 1) {
            console.log('⚠️ Регламенти не знайдені, використовуються стандартні правила');
            return [];
        }

        const regulations = [];
        
        for (let i = 1; i < regulationsData.length; i++) {
            const row = regulationsData[i];
            if (row.length < 5) continue;

            const regulation = {
                licensePattern: (row[0] || '').trim() || '*',
                brandPattern: (row[1] || '').trim() || '*',
                modelPattern: (row[2] || '').trim() || '*',
                yearFrom: parseNumber(row[3]) || 0,
                yearTo: parseNumber(row[4]) || 2100,
                partName: (row[5] || '').trim(),
                periodType: (row[6] || '').trim() || 'пробіг',
                normalValue: parseNumber(row[7]),
                warningValue: parseNumber(row[8]),
                criticalValue: parseNumber(row[9]),
                unit: (row[10] || '').trim() || 'км',
                priority: parseNumber(row[12]) || 2
            };

            regulations.push(regulation);
        }

        regulations.sort((a, b) => a.priority - b.priority);
        
        console.log('✅ Завантажено регламентів:', regulations.length);
        return regulations;
    }
}

// Експортуємо для використання
window.DataProcessor = DataProcessor;
