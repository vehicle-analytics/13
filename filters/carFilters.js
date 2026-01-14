/**
 * Фільтрація автомобілів та історії
 */

class CarFilters {
    /**
     * Фільтрує список автомобілів
     */
    static filterCars(cars, state, calculateHealthScore, getHealthScoreLabel) {
        const { searchTerm, selectedCity, selectedStatus, selectedPartFilter, selectedHealthStatus, selectedModel } = state;
        const term = searchTerm.toLowerCase();
        const isAllCities = selectedCity === 'Всі міста';

        return cars.filter(car => {
            if (term && !(
                (car.car && car.car.toLowerCase().includes(term)) ||
                (car.city && car.city.toLowerCase().includes(term)) ||
                (car.model && car.model.toLowerCase().includes(term)) ||
                (car.license && car.license.toLowerCase().includes(term))
            )) return false;

            if (!isAllCities && car.city !== selectedCity) return false;

            if (selectedHealthStatus) {
                const healthScore = calculateHealthScore(car);
                const healthLabel = getHealthScoreLabel(healthScore);
                if (healthLabel !== selectedHealthStatus) return false;
            }

            if (selectedModel) {
                const carBrand = car.model ? car.model.split(' ')[0] : '';
                if (carBrand !== selectedModel) return false;
            }

            if (selectedStatus !== 'all') {
                const healthScore = calculateHealthScore(car);
                
                if (selectedStatus === 'good') {
                    if (healthScore < 61) return false;
                } else if (selectedStatus === 'warning') {
                    if (healthScore < 35 || healthScore >= 61) return false;
                } else if (selectedStatus === 'critical') {
                    if (healthScore >= 35) return false;
                }
            }

            if (selectedPartFilter) {
                const part = car.parts[selectedPartFilter.partName];
                if (selectedPartFilter.status === 'all') {
                    if (!part) return false;
                } else if (!part || part.status !== selectedPartFilter.status) {
                    return false;
                }
            }

            return true;
        });
    }

    /**
     * Фільтрує історію автомобіля
     */
    static filterCarHistory(history, partFilter, searchTerm) {
        let filtered = [...history];

        if (partFilter) {
            const keywords = CONSTANTS.PARTS_CONFIG[partFilter];
            if (keywords) {
                const keywordsLower = keywords.map(k => k.toLowerCase());
                filtered = filtered.filter(record => {
                    const descLower = record.description.toLowerCase();
                    for (const keyword of keywordsLower) {
                        if (descLower.includes(keyword)) return true;
                    }
                    return false;
                });
            }
        }

        if (searchTerm && searchTerm.trim() !== '') {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(record =>
                record.description.toLowerCase().includes(term) ||
                (record.date && record.date.toLowerCase().includes(term)) ||
                record.mileage.toString().includes(term) ||
                (record.partCode && record.partCode.toLowerCase().includes(term)) ||
                (record.unit && record.unit.toLowerCase().includes(term)) ||
                (record.status && record.status.toLowerCase().includes(term))
            );
        }

        return filtered;
    }
}

// Експортуємо для використання
window.CarFilters = CarFilters;
