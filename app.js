/**
 * 🚗 Аналітична панель відстеження запчастин
 * Версія 6.5 - Розширена версія з аналітикою та візуалізацією
 */

class CarAnalyticsApp {
    constructor() {
        this.appData = null;
        this.cachedData = null;
        this.processedCars = null;
        this.filteredCars = null;
        this.maintenanceRegulations = [];

        // === ДОДАЄМО ОБ'ЄКТ КАТЕГОРІЙ ===
        // Використовуємо зовнішній файл або створюємо резервну копію
        this.expenseCategories = window.EXPENSE_CATEGORIES_CONFIG || this.getDefaultCategories();
        
        // === ІНІЦІАЛІЗУЄМО МОДУЛІ ===
        this.breakdownAnalysis = window.BreakdownFrequencyAnalysis ? new window.BreakdownFrequencyAnalysis() : null;
        this.carWashChecker = window.CarWashRecommendations ? new window.CarWashRecommendations() : null;
        this.partsForecast = window.PartsPurchaseForecast ? new window.PartsPurchaseForecast() : null;
        this.carRecommendations = window.CarRecommendations ? new window.CarRecommendations() : null;
        this.maintenanceForecastModule = window.MaintenanceForecast ? new window.MaintenanceForecast() : null;
        
        this.state = {
            searchTerm: '',
            selectedCity: 'Всі міста',
            selectedCar: null,
            selectedStatus: 'all',
            selectedPartFilter: null,
            selectedHistoryPartFilter: null,
            historySearchTerm: '',
            currentView: 'list',
            selectedYear: null,
            selectedHealthStatus: null,
            selectedModel: null
        };

        this.focusInfo = null;
        this.renderScheduled = false;

        this.init();
    }

    async init() {
        console.log('🚀 Ініціалізація аналітичної панелі...');

        this.updateLoadingProgress(10);
        this.setupEventListeners();
        this.updateLoadingProgress(20);
        await this.loadData();
        this.updateLoadingProgress(100);

        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            document.getElementById('main-interface').classList.remove('hidden');
            this.render();
        }, 500);

        this.startAutoRefresh();
    }

    // === БАЗОВІ МЕТОДИ ПАРСИНГУ ===
    // Використовуємо модуль Formatters
    parseNumber(value) {
        return Formatters.parseNumber(value);
    }

    convertToThousands(value) {
        return Formatters.convertToThousands(value);
    }

    formatNumber(number) {
        return Formatters.formatNumber(number);
    }

    formatMileage(mileage) {
        return Formatters.formatMileage(mileage);
    }

    getOriginalMileage(mileage) {
        return Formatters.getOriginalMileage(mileage);
    }

    formatMileageDiff(mileageDiff) {
        return Formatters.formatMileageDiff(mileageDiff);
    }

    formatPrice(price) {
        return Formatters.formatPrice(price);
    }

    // === ОБРОБКА ДАТИ ===
    formatDate(dateString) {
        return Formatters.formatDate(dateString);
    }

    parseDate(dateString) {
        return Formatters.parseDate(dateString);
    }

    // === ПІДПИСКА НА ПОДІЇ ===
    setupEventListeners() {
        document.getElementById('refresh-data')?.addEventListener('click', () => {
            this.refreshData(true);
        });

        document.getElementById('clear-cache')?.addEventListener('click', () => {
            this.clearCache();
        });


        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.selectedCar) {
                this.state.selectedCar = null;
                this.state.selectedHistoryPartFilter = null;
                this.state.historySearchTerm = '';
                this.render();
            }

            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                this.refreshData(true);
            }
        });
    }

    // === ЗАВАНТАЖЕННЯ ДАНИХ ===
    updateLoadingProgress(percent) {
        const bar = document.getElementById('loading-bar');
        if (bar) {
            bar.style.width = `${percent}%`;
        }
    }

    async loadData() {
        console.log('📥 Завантаження даних...');

        try {
            const cached = this.getCachedData();
            if (cached) {
                console.log('✅ Використано кешовані дані');
                this.appData = cached;
                this.maintenanceRegulations = cached.regulations || [];
                this.updateCacheInfo();
                return;
            }

            await this.fetchDataFromSheets();

        } catch (error) {
            console.error('❌ Помилка завантаження даних:', error);
            this.showError(`Помилка завантаження: ${error.message}`);
        }
    }

    async fetchDataFromSheets() {
        const config = window.CONFIG;
        const { SPREADSHEET_ID, SHEETS, API_KEY } = config;

        console.log('📋 Завантаження даних з Google Sheets...');

        const [scheduleData, historyData, regulationsData, photoAssessmentData] = await Promise.all([
            this.fetchSheetData(SPREADSHEET_ID, SHEETS.SCHEDULE, API_KEY),
            this.fetchSheetData(SPREADSHEET_ID, SHEETS.HISTORY, API_KEY),
            this.fetchSheetData(SPREADSHEET_ID, SHEETS.REGULATIONS, API_KEY),
            this.fetchSheetData(SPREADSHEET_ID, SHEETS.PHOTO_ASSESSMENT, API_KEY)
        ]);

        console.log('✅ Дані отримано:', {
            scheduleRows: scheduleData?.length || 0,
            historyRows: historyData?.length || 0,
            regulationsRows: regulationsData?.length || 0,
            photoAssessmentRows: photoAssessmentData?.length || 0
        });

        this.processData(scheduleData, historyData, regulationsData, photoAssessmentData);
        this.cacheData(this.appData);
        console.log('✅ Дані успішно оброблено');
        this.updateCacheInfo();
    }

    async fetchSheetData(spreadsheetId, sheetName, apiKey) {
        try {
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}?key=${apiKey}`;
            console.log(`📥 Запит до: ${sheetName}`);

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data.values || [];
        } catch (error) {
            console.error(`❌ Помилка завантаження аркуша ${sheetName}:`, error);
            return null;
        }
    }

    // === ОБРОБКА ДАНИХ ===
    // Використовуємо модуль DataProcessor
    processData(scheduleData, historyData, regulationsData, photoAssessmentData) {
        const result = DataProcessor.processData(
            scheduleData, 
            historyData, 
            regulationsData, 
            photoAssessmentData,
            (value) => this.parseNumber(value),
            (dateString) => this.parseDate(dateString),
            (dateString) => this.formatDate(dateString)
        );
        
        this.appData = result.appData;
        this.maintenanceRegulations = result.maintenanceRegulations;
        
        this.processedCars = null;
        this.filteredCars = null;
    }

    processRegulations(regulationsData) {
        this.maintenanceRegulations = DataProcessor.processRegulations(
            regulationsData,
            (value) => this.parseNumber(value)
        );
    }

    // === КЕШУВАННЯ ===
    // Використовуємо модуль CacheManager
    getCachedData() {
        return CacheManager.getCachedData();
    }

    cacheData(data) {
        CacheManager.cacheData(data);
    }

    clearCache() {
        const success = CacheManager.clearCache();
        this.processedCars = null;
        this.filteredCars = null;
        if (success) {
            this.showNotification('Кеш успішно очищено', 'success');
        } else {
            this.showNotification('Помилка очищення кешу', 'error');
        }
        this.updateCacheInfo();
    }

    updateCacheInfo() {
        CacheManager.updateCacheInfo();
    }

    // === АВТООНОВЛЕННЯ ===
    startAutoRefresh() {
        console.log('⏰ Налаштовую щоденне автооновлення на 06:00');
        
        const calculateTimeUntilRefresh = () => {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            const refreshTime = new Date(today);
            const [hours, minutes] = window.CONFIG.REFRESH_TIME.split(':').map(Number);
            refreshTime.setHours(hours, minutes, 0, 0);
            
            if (now >= refreshTime) {
                refreshTime.setDate(refreshTime.getDate() + 1);
            }
            
            const timeUntilRefresh = refreshTime - now;
            const hoursUntil = Math.floor(timeUntilRefresh / (1000 * 60 * 60));
            const minutesUntil = Math.floor((timeUntilRefresh % (1000 * 60 * 60)) / (1000 * 60));
            
            console.log(`⏰ Наступне оновлення о ${window.CONFIG.REFRESH_TIME} (через ${hoursUntil}г ${minutesUntil}хв)`);
            
            return timeUntilRefresh;
        };
        
        const firstRefreshDelay = calculateTimeUntilRefresh();
        setTimeout(() => {
            console.log('🔄 Автоматичне оновлення за розкладом (06:00)');
            this.refreshData();
            
            setInterval(() => {
                console.log('🔄 Автоматичне оновлення за розкладом (06:00)');
                this.refreshData();
            }, 24 * 60 * 60 * 1000);
        }, firstRefreshDelay);
    }

    // === ОСНОВНІ МЕТОДИ РЕНДЕРУ ===
    render() {
        if (!this.appData) {
            this.showError('Дані не завантажено');
            return;
        }

        if (!this.appData._meta || this.appData._meta.totalCars === 0) {
            this.renderNoData();
            return;
        }

        if (this.state.selectedCar) {
            this.renderCarDetail();
        } else {
            this.renderCarList();
        }
    }

    renderNoData() {
        const html = `
            <div class="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-900">
                <div class="text-center max-w-md">
                    <div class="text-4xl mb-4">🚫</div>
                    <h1 class="text-2xl font-bold text-white mb-2">Немає даних</h1>
                    <p class="text-blue-200 text-sm mb-6">Не знайдено автомобілів для відображення</p>
                    <div class="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                        <div class="text-white text-sm mb-3">
                            Можливі причини:
                            <ul class="text-left mt-2 text-blue-200">
                                <li>• Аркуш "ГРАФІК ОБСЛУГОВУВАННЯ" порожній</li>
                                <li>• Неправильні назви аркушів</li>
                                <li>• Проблеми з API ключем</li>
                            </ul>
                        </div>
                        <button onclick="app.refreshData(true)"
                                class="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors w-full">
                            🔄 Спробувати знову
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('main-interface').innerHTML = html;
    }

    renderCarList() {
        if (!this.processedCars) {
            this.processedCars = this.processCarData();
        }
        
        const data = this.processedCars;
        const filteredData = this.filterCars(data);
        const cities = this.getCities(data);
        const stats = this.calculateStats(data);

        const html = this.generateCarListHTML(data, filteredData, cities, stats);
        const mainInterface = document.getElementById('main-interface');
        mainInterface.innerHTML = html;
        
        // Додаємо обробники подій після рендерингу
        const appInstance = this;
        setTimeout(() => {
            // Обробник кліків на рядки таблиці
            const table = document.getElementById('cars-table');
            if (table) {
                table.addEventListener('click', function(e) {
                    const row = e.target.closest('tr[data-car-id]');
                    if (row) {
                        e.stopPropagation();
                        e.preventDefault();
                        const carId = row.getAttribute('data-car-id');
                        if (carId && appInstance) {
                            appInstance.setState({ selectedCar: carId });
                        }
                    }
                });
            }
            
            // Обробник фільтра по місту
            const cityFilter = document.getElementById('city-filter-select');
            if (cityFilter) {
                cityFilter.addEventListener('change', function(e) {
                    appInstance.setState({ selectedCity: e.target.value });
                });
            }
            
            // Обробник кліків на картки статусів
            const statusCards = mainInterface.querySelectorAll('[data-status-card]');
            statusCards.forEach(card => {
                card.addEventListener('click', function() {
                    const status = this.getAttribute('data-status-card');
                    appInstance.setState({ selectedStatus: status });
                });
            });
            
            // Обробник кнопки скидання фільтра
            const clearFilterBtn = document.getElementById('clear-part-filter-btn');
            if (clearFilterBtn) {
                clearFilterBtn.addEventListener('click', function() {
                    appInstance.clearPartFilter();
                });
            }
        }, 50);
        
        this.restoreFocus();
    }

    renderCarDetail() {
        if (!this.processedCars) {
            this.processedCars = this.processCarData();
        }
        
        const data = this.processedCars;
        const car = data.find(c => c.car === this.state.selectedCar);

        if (!car) {
            this.state.selectedCar = null;
            this.render();
            return;
        }

        const html = this.generateCarDetailHTML(car);
        document.getElementById('main-interface').innerHTML = html;
        
        this.restoreFocus();
    }

    // === ФОКУС У ПОШУКУ ===
    saveFocus() {
        const activeElement = document.activeElement;
        if (activeElement && (activeElement.id === 'mainSearchInput' || activeElement.id === 'historySearchInput')) {
            this.focusInfo = {
                id: activeElement.id,
                value: activeElement.value,
                selectionStart: activeElement.selectionStart,
                selectionEnd: activeElement.selectionEnd
            };
        } else {
            this.focusInfo = null;
        }
    }

    restoreFocus() {
        if (this.focusInfo) {
            setTimeout(() => {
                const element = document.getElementById(this.focusInfo.id);
                if (element) {
                    if (this.focusInfo.id === 'mainSearchInput' && element.value !== this.state.searchTerm) {
                        element.value = this.state.searchTerm;
                    } else if (this.focusInfo.id === 'historySearchInput' && element.value !== this.state.historySearchTerm) {
                        element.value = this.state.historySearchTerm;
                    }
                    
                    element.focus();
                    element.setSelectionRange(this.focusInfo.selectionStart, this.focusInfo.selectionEnd);
                }
                this.focusInfo = null;
            }, 10);
        }
    }

    // === ОБРОБКА ВВОДУ ===
    handleSearchInput(event) {
        this.saveFocus();
        this.state.searchTerm = event.target.value;
        
        if (!this.renderScheduled) {
            this.renderScheduled = true;
            setTimeout(() => {
                this.filteredCars = null;
                this.renderCarList();
                this.renderScheduled = false;
            }, 50);
        }
    }

    handleHistorySearchInput(event) {
        this.saveFocus();
        this.state.historySearchTerm = event.target.value;
        
        if (!this.renderScheduled) {
            this.renderScheduled = true;
            setTimeout(() => {
                this.renderCarDetail();
                this.renderScheduled = false;
            }, 50);
        }
    }

    handleSelectChange(event) {
        this.setState({ selectedCity: event.target.value });
    }

    // === ОБРОБКА АВТОМОБІЛІВ ===
    // Використовуємо модуль CarProcessor
    processCarData() {
        return CarProcessor.processCarData(
            this.appData,
            (partName, mileageDiff, daysDiff, carYear, carModel, license) => 
                this.getPartStatus(partName, mileageDiff, daysDiff, carYear, carModel, license),
            (license, model, year, partName) => 
                this.findRegulationForCar(license, model, year, partName)
        );
    }

    // === СТАН ЗАПЧАСТИН ===
    // Використовуємо модуль CarProcessor
    findRegulationForCar(license, model, year, partName) {
        return CarProcessor.findRegulationForCar(license, model, year, partName, this.maintenanceRegulations);
    }

    getPartStatus(partName, mileageDiff, daysDiff, carYear, carModel, license) {
        return CarProcessor.getPartStatus(
            partName, 
            mileageDiff, 
            daysDiff, 
            carYear, 
            carModel, 
            license,
            this.maintenanceRegulations,
            (license, model, year, partName, maintenanceRegulations) => 
                CarProcessor.findRegulationForCar(license, model, year, partName, maintenanceRegulations)
        );
    }

    getPartStatusLegacy(partName, mileageDiff, daysDiff, carYear, carModel) {
        return CarProcessor.getPartStatusLegacy(partName, mileageDiff, daysDiff, carYear, carModel);
    }

    // === ФІЛЬТРАЦІЯ ===
    // Використовуємо модуль CarFilters
    filterCars(cars) {
        return CarFilters.filterCars(
            cars,
            this.state,
            (car) => this.calculateHealthScore(car),
            (score) => this.getHealthScoreLabel(score)
        );
    }

    filterCarHistory(history, partFilter, searchTerm) {
        return CarFilters.filterCarHistory(history, partFilter, searchTerm);
    }

    // === ГЕНЕРАЦІЯ HTML ДЛЯ СПИСКУ АВТО ===
    generateCarListHTML(allCars, filteredCars, cities, stats) {
        const importantParts = CONSTANTS.PARTS_ORDER.slice(0, 7);

        // Розрахунок часу до наступного оновлення
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const refreshTime = new Date(today);
        const [hours, minutes] = window.CONFIG.REFRESH_TIME.split(':').map(Number);
        refreshTime.setHours(hours, minutes, 0, 0);
        
        if (now >= refreshTime) {
            refreshTime.setDate(refreshTime.getDate() + 1);
        }
        
        const hoursUntil = Math.floor((refreshTime - now) / (1000 * 60 * 60));
        const minutesUntil = Math.floor(((refreshTime - now) % (1000 * 60 * 60)) / (1000 * 60));
        
        const nextRefreshInfo = `Наступне оновлення: ${window.CONFIG.REFRESH_TIME} (через ${hoursUntil}г ${minutesUntil}хв)`;

        return `
            <div class="min-h-screen bg-gray-50">
                <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-b-xl shadow-xl p-4 mb-6">
                    <div class="w-full px-2 sm:px-4">
                        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h1 class="text-2xl sm:text-3xl font-bold text-white mb-1">🚗 Список автомобілів</h1>
                                <p class="text-blue-100 text-sm">Натисніть на рядок для перегляду деталей</p>
                            </div>
                            <div class="text-right">
                                <div class="text-blue-100 text-xs">Дата оновлення</div>
                                <div class="text-white text-lg font-bold">${this.appData.currentDate}</div>
                                <div class="text-blue-200 text-xs">${allCars.length} авто • ${this.appData._meta.totalRecords} записів</div>
                                <div class="text-blue-100 text-xs mt-1">${nextRefreshInfo}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-full px-3 sm:px-4">
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        ${this.generateStatsCards(stats)}
                    </div>

                    <div class="bg-white rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
                        ${this.generateFiltersHTML(cities)}
                    </div>

                    <div class="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-200">
                        ${this.generateCarsTable(filteredCars, importantParts)}
                    </div>

                    <div class="mt-4 bg-white rounded-xl shadow-lg p-4 border border-gray-200">
                        <h3 class="font-bold text-gray-800 mb-2 text-sm">📊 Легенда</h3>
                        <div class="flex flex-wrap gap-4 text-xs">
                            <div class="flex items-center gap-2"><div class="w-4 h-4 bg-green-500 rounded-full"></div><span>Норма</span></div>
                            <div class="flex items-center gap-2"><div class="w-4 h-4 bg-orange-500 rounded-full"></div><span>Увага</span></div>
                            <div class="flex items-center gap-2"><div class="w-4 h-4 bg-red-500 rounded-full"></div><span>Критично</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    generateStatsCards(stats) {
        const { totalCars, carsWithGood, carsWithWarning, carsWithCritical, carsExcellent, carsGood, carsSatisfactory, carsBad, carsCritical } = stats;
        const { selectedStatus } = this.state;

        const cards = [
            { 
                count: totalCars, 
                label: 'Всього авто', 
                status: 'all', 
                color: 'from-blue-500 to-blue-600', 
                icon: '🚗',
                details: ''
            },
            { 
                count: carsWithGood, 
                label: 'У нормі', 
                status: 'good', 
                color: 'from-green-500 to-green-600', 
                icon: '✅',
                details: `Відмінний: ${carsExcellent || 0}, Добрий: ${carsGood || 0}`
            },
            { 
                count: carsWithWarning, 
                label: 'Увага', 
                status: 'warning', 
                color: 'from-orange-500 to-orange-600', 
                icon: '⚠️',
                details: `Задовільний: ${carsSatisfactory || 0}, Поганий: ${carsBad || 0}`
            },
            { 
                count: carsWithCritical, 
                label: 'Критично', 
                status: 'critical', 
                color: 'from-red-500 to-red-600', 
                icon: '⛔',
                details: `Критичний: ${carsCritical || 0}`
            }
        ];

        return cards.map(card => `
            <div class="bg-gradient-to-br ${card.color} rounded-lg shadow-lg p-3 sm:p-4 text-white cursor-pointer hover:shadow-xl transition-all ${selectedStatus === card.status ? 'ring-2 ring-blue-300' : ''}"
                 data-status-card="${card.status}">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="text-xl sm:text-2xl font-bold mb-1">${card.count}</div>
                        <div class="text-white/90 text-xs sm:text-sm font-medium mb-1">${card.label}</div>
                        ${card.details ? `<div class="text-white/80 text-[10px] sm:text-xs mt-1 leading-tight">${card.details}</div>` : ''}
                    </div>
                    <div class="text-xl sm:text-2xl ml-2">${card.icon}</div>
                </div>
                ${selectedStatus === card.status ? '<div class="text-xs text-white/70 mt-1 sm:mt-2">● Активний</div>' : ''}
            </div>
        `).join('');
    }

    generateFiltersHTML(cities) {
        const { selectedPartFilter, searchTerm, selectedCity, selectedHealthStatus, selectedModel } = this.state;
        
        const hasAnyFilter = selectedPartFilter || selectedHealthStatus || selectedModel;

        return `
            <div class="flex items-center justify-between mb-3">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2"><span>🔍</span> Фільтри</h3>
                ${hasAnyFilter ? `
                    <button onclick="app.clearAllFilters();"
                            class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition-colors">
                        ✕ Скинути фільтр
                    </button>
                ` : ''}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Пошук авто</label>
                    <input
                        type="text"
                        value="${searchTerm}"
                        oninput="app.handleSearchInput(event)"
                        placeholder="Номер, модель, місто..."
                        class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                        id="mainSearchInput"
                        autocomplete="off"
                        autocorrect="off"
                        spellcheck="false"
                    >
                </div>
                <div>
                    <label class="block text-xs font-medium text-gray-700 mb-1">Місто</label>
                    <select id="city-filter-select"
                            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800">
                        ${cities.map(city => `
                            <option value="${city}" ${city === selectedCity ? 'selected' : ''} class="text-gray-800 bg-white">${city}</option>
                        `).join('')}
                    </select>
                </div>
            </div>
            ${selectedPartFilter || selectedHealthStatus || selectedModel ? `
                <div class="mt-3 space-y-2">
            ${selectedPartFilter ? `
                        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div class="text-sm font-semibold text-blue-800 flex items-center gap-2">
                        <span>📌</span>
                        <span>Активний фільтр: ${selectedPartFilter.partName} -
                        ${selectedPartFilter.status === 'all' ? 'Всі записи' :
                          selectedPartFilter.status === 'good' ? '✅ У нормі' :
                          selectedPartFilter.status === 'warning' ? '⚠️ Увага' : '⛔ Критично'}</span>
                    </div>
                        </div>
                    ` : ''}
                    ${selectedHealthStatus ? `
                        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div class="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                <span>📌</span>
                                <span>Активний фільтр: Стан авто - ${selectedHealthStatus}</span>
                            </div>
                        </div>
                    ` : ''}
                    ${selectedModel ? `
                        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div class="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                <span>📌</span>
                                <span>Активний фільтр: Марка - ${selectedModel}</span>
                            </div>
                        </div>
                    ` : ''}
                </div>
            ` : ''}
        `;
    }

    generateCarsTable(cars, importantParts) {
        if (cars.length === 0) {
            return `
                <div class="px-4 py-12 text-center">
                    <div class="text-gray-400 text-lg mb-2">🚫</div>
                    <div class="text-gray-600 font-medium">Автомобілів не знайдено</div>
                    <div class="text-gray-400 text-sm mt-1">Спробуйте змінити параметри пошуку</div>
                </div>
            `;
        }

        const tableHeaders = this.generateTableHeaders(importantParts);
        const tableRows = cars.map((car, idx) => this.generateCarRow(car, idx, importantParts)).join('');

        return `
            <div class="scroll-hint-container">
                <div class="overflow-x-auto w-full">
                    <table id="cars-table" class="w-full min-w-[1100px]">
                        <thead class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            <tr>
                                <th class="px-2 py-2 text-left text-xs font-bold uppercase w-[100px]">
                                    <div class="cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
                                         onclick="event.stopPropagation(); app.showHealthStatusFilterMenu(event);">
                                        Стан авто
                                    </div>
                                </th>
                                <th class="px-2 py-2 text-left text-xs font-bold uppercase w-[90px]">Номер</th>
                                <th class="px-2 py-2 text-left text-xs font-bold uppercase mobile-hidden w-[120px]">
                                    <div class="cursor-pointer hover:bg-white/10 p-1 rounded transition-colors"
                                         onclick="event.stopPropagation(); app.showModelFilterMenu(event);">
                                        Марка
                                    </div>
                                </th>
                                <th class="px-2 py-2 text-left text-xs font-bold uppercase mobile-hidden w-[50px]">Рік</th>
                                <th class="px-2 py-2 text-left text-xs font-bold uppercase w-[80px]">Місто</th>
                                <th class="px-2 py-2 text-left text-xs font-bold uppercase w-[80px]">Пробіг</th>
                                ${tableHeaders}
                                <th class="px-1 py-2 text-center text-xs font-bold uppercase mobile-hidden w-[50px]">✅</th>
                                <th class="px-1 py-2 text-center text-xs font-bold uppercase mobile-hidden w-[50px]">⚠️</th>
                                <th class="px-1 py-2 text-center text-xs font-bold uppercase mobile-hidden w-[50px]">⛔</th>
                                <th class="px-1 py-2 text-center text-xs font-bold uppercase w-[50px]">📋</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-200">
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
                <div class="mt-2 pt-2 text-center">
                    <div class="inline-flex items-center gap-2 text-xs text-gray-500">
                        <span>↔️</span>
                        <span>Гортай таблицю вправо</span>
                        <span>→</span>
                    </div>
                </div>
            </div>
        `;
    }

    generateTableHeaders(importantParts) {
        return importantParts.map(partName => {
            let shortName, emoji;

            if (partName.includes('ТО')) {
                shortName = 'ТО';
                emoji = '🛢️';
            } else if (partName.includes('ГРМ')) {
                shortName = 'ГРМ';
                emoji = '⚙️';
            } else if (partName.includes('Помпа')) {
                shortName = 'Помпа';
                emoji = '💧';
            } else if (partName.includes('Обвід')) {
                shortName = 'Обвід';
                emoji = '🔧';
            } else if (partName.includes('Діагн')) {
                shortName = 'Діаг';
                emoji = '🔍';
            } else if (partName.includes('Розвал')) {
                shortName = 'Розв';
                emoji = '📐';
            } else if (partName.includes('Профілактика') || partName.includes('Супорт')) {
                shortName = 'Супорт';
                emoji = '🛠️';
            } else {
                shortName = partName.split(' ')[0];
                emoji = '🔧';
            }

            return `
                <th class="px-1 py-1 text-center text-[10px] font-bold uppercase w-[65px]">
                    <div class="cursor-pointer hover:bg-white/10 p-0.5 rounded transition-colors"
                         onclick="event.stopPropagation(); app.showPartFilterMenu(event, '${partName}')">
                        <div class="font-bold">${shortName}</div>
                        <div class="opacity-70">${emoji}</div>
                    </div>
                </th>
            `;
        }).join('');
    }

    generateCarRow(car, idx, importantParts) {
        const carIdentifier = (car.car || car.license || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
        const parts = Object.values(car.parts).filter(p => p !== null);
        const criticalCount = parts.filter(p => p.status === 'critical').length;
        const warningCount = parts.filter(p => p.status === 'warning').length;
        const goodCount = parts.filter(p => p.status === 'good').length;

        const statusColor = criticalCount > 0 ? 'bg-red-500' : warningCount > 0 ? 'bg-orange-500' : 'bg-green-500';
        
        const rowBg = idx % 2 === 0 ? 'bg-gray-50' : 'bg-white';

        const partCells = importantParts.map(partName => {
            const part = car.parts[partName];
            const isMonths = partName.includes('Діагностика') || partName.includes('Розвал') || partName.includes('Профілактика');
            const display = this.getPartDisplay(part, isMonths);
            return `<td class="px-1 py-2 text-center">
                        <div class="${display.bg} ${display.color} font-semibold ${display.textSize} py-1 px-0.5 rounded whitespace-nowrap overflow-hidden text-ellipsis max-w-[60px] mx-auto">
                            ${display.text}
                        </div>
                    </td>`;
        }).join('');

        const healthScore = this.calculateHealthScore(car);
        const healthStatus = this.getHealthScoreStatus(healthScore);

        return `
            <tr class="${rowBg} hover:bg-blue-50 cursor-pointer transition-colors"
                data-car-id="${carIdentifier}">
                <td class="px-2 py-3">
                    <div class="flex flex-col items-center gap-1">
                        <div class="flex items-center gap-1.5 w-full">
                            <div class="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r ${this.getHealthScoreColor(healthScore)} rounded-full" 
                                     style="width: ${healthScore}%"></div>
                            </div>
                            <span class="text-xs font-bold text-gray-800 whitespace-nowrap">${healthScore}%</span>
                        </div>
                        <div class="text-[10px] text-gray-600 text-center w-full">${healthStatus}</div>
                    </div>
                </td>
                <td class="px-2 py-3">
                    <div class="font-bold text-gray-800 text-sm whitespace-nowrap overflow-hidden text-ellipsis max-w-[85px]"
                         title="${car.license}">${car.license}</div>
                </td>
                <td class="px-2 py-3 mobile-hidden">
                    <div class="text-gray-700 text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[115px]"
                         title="${car.model}">${car.model}</div>
                </td>
                <td class="px-2 py-3 mobile-hidden">
                    <div class="text-gray-600 text-xs whitespace-nowrap">${car.year || '-'}</div>
                </td>
                <td class="px-2 py-3">
                    <div class="text-gray-700 text-xs whitespace-nowrap flex items-center gap-1 max-w-[75px]">
                        <span class="text-[10px]">📍</span>
                        <span class="font-medium truncate" title="${car.city || '-'}">${car.city || '-'}</span>
                    </div>
                </td>
                <td class="px-2 py-3">
                    <div class="font-semibold text-gray-800 text-xs whitespace-nowrap overflow-hidden text-ellipsis max-w-[75px]">
                        ${this.formatMileage(car.currentMileage)}
                    </div>
                </td>
                ${partCells}
                <td class="px-1 py-3 text-center mobile-hidden">
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                        ${goodCount}
                    </span>
                </td>
                <td class="px-1 py-3 text-center mobile-hidden">
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs">
                        ${warningCount}
                    </span>
                </td>
                <td class="px-1 py-3 text-center mobile-hidden">
                    <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-700 font-bold text-xs">
                        ${criticalCount}
                    </span>
                </td>
                <td class="px-1 py-3 text-center">
                    <div class="text-blue-600 font-semibold text-xs whitespace-nowrap">
                        ${car.history.length}
                    </div>
                </td>
            </tr>
        `;
    }

    getPartDisplay(part, isMonths = false) {
        if (!part) return { color: 'text-gray-400', text: '-', bg: 'bg-gray-100', textSize: 'text-table-value' };

        let color = 'text-green-600', bg = 'bg-green-100';
        if (part.status === 'warning') { color = 'text-orange-600'; bg = 'bg-orange-100'; }
        else if (part.status === 'critical') { color = 'text-red-600'; bg = 'bg-red-100'; }

        const text = isMonths ?
            Math.floor(part.daysDiff / 30) + 'міс' :
            this.formatMileageDiff(part.mileageDiff);

        return { color, text, bg, textSize: 'text-table-value' };
    }

    // === НОВІ ФУНКЦІЇ: HEALTH SCORE ===
    // Використовуємо модуль StatsCalculator
    calculateHealthScore(car) {
        return StatsCalculator.calculateHealthScore(car);
    }

    getHealthScoreColor(score) {
        return StatsCalculator.getHealthScoreColor(score);
    }
    
    getHealthScoreLabel(score) {
        return StatsCalculator.getHealthScoreLabel(score);
    }
    
    getHealthScoreStatus(score) {
        return StatsCalculator.getHealthScoreStatus(score);
    }

    // === НОВІ ФУНКЦІЇ: АНАЛІЗ ВИТРАТ ===
    calculateCostStats(history, car = null, selectedYear = null) {
        const stats = {
            totalSpent: 0,
            averagePerMonth: 0,
            lastYearSpent: 0,
            byCategory: {},
            byMonth: {},
            byYear: {},
            predictions: {}
        };
        
        const now = new Date();
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        
        // Фільтруємо історію за вибраним роком
        let filteredHistory = history;
        if (selectedYear) {
            filteredHistory = history.filter(record => {
                if (!record.date) return false;
                
                let recordDate = null;
                // Якщо дата в форматі DD.MM.YYYY
                if (typeof record.date === 'string' && record.date.includes('.')) {
                    const parts = record.date.split('.');
                    if (parts.length === 3) {
                        const [day, month, year] = parts;
                        recordDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                    }
                } else {
                    recordDate = new Date(record.date);
                }
                
                if (!recordDate || isNaN(recordDate.getTime())) {
                    return false;
                }
                
                return recordDate.getFullYear() === selectedYear;
            });
        }
        
        // Групуємо витрати по місяцях та роках
        filteredHistory.forEach(record => {
            if (record.totalWithVAT > 0) {
                stats.totalSpent += record.totalWithVAT;
                
                // Парсимо дату з урахуванням формату DD.MM.YYYY
                let recordDate = null;
                if (record.date) {
                    // Якщо дата в форматі DD.MM.YYYY
                    if (typeof record.date === 'string' && record.date.includes('.')) {
                        const parts = record.date.split('.');
                        if (parts.length === 3) {
                            const [day, month, year] = parts;
                            recordDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                        }
                    } else {
                        // Спробуємо стандартний парсинг
                        recordDate = new Date(record.date);
                    }
                }
                
                // Перевіряємо чи дата валідна
                if (!recordDate || isNaN(recordDate.getTime())) {
                    // Якщо дата невалідна, пропускаємо групування по датах, але враховуємо в загальній сумі
                    const category = this.detectExpenseCategory(record.description);
                    stats.byCategory[category] = (stats.byCategory[category] || 0) + record.totalWithVAT;
                    return;
                }
                
                const recordYear = recordDate.getFullYear();
                
                // Групування по роках
                stats.byYear[recordYear] = (stats.byYear[recordYear] || 0) + record.totalWithVAT;
                
                if (recordDate >= oneYearAgo) {
                    stats.lastYearSpent += record.totalWithVAT;
                }
                
                // Групування по місяцях (РРРР-ММ)
                try {
                const monthKey = recordDate.toISOString().substring(0, 7);
                stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + record.totalWithVAT;
                } catch (e) {
                    // Якщо не вдалося отримати ISO string, використовуємо альтернативний метод
                    const year = recordDate.getFullYear();
                    const month = String(recordDate.getMonth() + 1).padStart(2, '0');
                    const monthKey = `${year}-${month}`;
                    stats.byMonth[monthKey] = (stats.byMonth[monthKey] || 0) + record.totalWithVAT;
                }
                
                // Визначення категорії витрат
                const category = this.detectExpenseCategory(record.description);
                stats.byCategory[category] = (stats.byCategory[category] || 0) + record.totalWithVAT;
            }
        });
        
        // Середньомісячні витрати (за останній рік)
        const monthsCount = Object.keys(stats.byMonth).length;
        stats.averagePerMonth = monthsCount > 0 ? stats.lastYearSpent / monthsCount : 0;
        
        // Прогноз на наступні 6 місяців на основі статусів запчастин та регламенту
        if (car) {
            stats.predictions.next6Months = this.calculateForecast6Months(car);
        } else {
            stats.predictions.next6Months = stats.averagePerMonth * 6;
        }
        
        return stats;
    }
    
    // Розрахунок прогнозу на 6 місяців на основі статусів та регламенту
    calculateForecast6Months(car) {
        // Використовуємо новий алгоритм якщо доступний
        if (this.partsForecast && this.processedCars) {
            try {
                const forecast = this.partsForecast.calculateForecast(
                    [car],
                    this.maintenanceRegulations,
                    (license, model, year, partName) => this.findRegulationForCar(license, model, year, partName),
                    6
                );
                return forecast.totalBudget;
            } catch (e) {
                console.warn('Помилка при використанні нового алгоритму прогнозу:', e);
            }
        }

        // Fallback до старого алгоритму
        const now = new Date();
        let forecastCost = 0;
        
        // Середні вартості робіт (можна витягти з історії)
        const avgCosts = this.getAverageCosts(car.history);
        
        // Перевіряємо всі запчастини та роботи
        for (const partName in car.parts) {
            const part = car.parts[partName];
            if (!part) continue;
            
            const regulation = this.findRegulationForCar(car.license, car.model, car.year, partName);
            if (!regulation || regulation.normalValue === 'chain') continue;
            
            // Визначаємо, коли потрібно буде обслуговування в наступні 6 місяців
            let monthsUntilService = null;
            
            if (regulation.periodType === 'пробіг') {
                const remainingKm = regulation.normalValue - part.mileageDiff;
                // Приблизна оцінка: скільки місяців до обслуговування на основі середньомісячного пробігу
                const avgMonthlyMileage = this.getAverageMonthlyMileage(car);
                if (avgMonthlyMileage > 0 && remainingKm > 0) {
                    monthsUntilService = remainingKm / avgMonthlyMileage;
                }
            } else if (regulation.periodType === 'місяць') {
                const remainingMonths = regulation.normalValue - Math.floor(part.daysDiff / 30);
                if (remainingMonths > 0) {
                    monthsUntilService = remainingMonths;
                }
            } else if (regulation.periodType === 'рік') {
                const remainingYears = regulation.normalValue - (part.daysDiff / 365);
                if (remainingYears > 0) {
                    monthsUntilService = remainingYears * 12;
                }
            }
            
            // Якщо обслуговування потрібне в наступні 6 місяців
            if (monthsUntilService !== null && monthsUntilService <= 6 && monthsUntilService > 0) {
                // Додаємо вартість, якщо статус критичний або попереджувальний
                if (part.status === 'critical' || part.status === 'warning') {
                    const cost = avgCosts[partName] || this.getEstimatedCost(partName);
                    forecastCost += cost;
                }
                
                // Для робіт (червоний або помаранчевий статус) - завжди додаємо
                const isWork = ['Діагностика ходової 🔍', 'Розвал-сходження 📐', 'Профілактика направляючих супортів 🛠️', 
                               "Компютерна діагностика 💻", 'Прожиг сажового фільтру 🔥', 'ТО (масло+фільтри) 🛢️'].includes(partName);
                if (isWork && (part.status === 'critical' || part.status === 'warning')) {
                    const cost = avgCosts[partName] || this.getEstimatedCost(partName);
                    forecastCost += cost;
                }
            }
        }
        
        // Додаємо базову оцінку на основі середньомісячних витрат (якщо немає критичних статусів)
        if (forecastCost === 0) {
            const avgMonthly = this.calculateCostStats(car.history).averagePerMonth;
            forecastCost = avgMonthly * 6;
        } else {
            // Додаємо 30% базових витрат до прогнозу
            const avgMonthly = this.calculateCostStats(car.history).averagePerMonth;
            forecastCost += avgMonthly * 6 * 0.3;
        }
        
        return forecastCost;
    }
    
    // Отримати середні вартості з історії
    getAverageCosts(history) {
        const costs = {};
        const counts = {};
        
        history.forEach(record => {
            if (record.totalWithVAT > 0) {
                const partName = this.findPartNameFromDescription(record.description);
                if (partName) {
                    costs[partName] = (costs[partName] || 0) + record.totalWithVAT;
                    counts[partName] = (counts[partName] || 0) + 1;
                }
            }
        });
        
        const averages = {};
        for (const partName in costs) {
            averages[partName] = costs[partName] / counts[partName];
        }
        
        return averages;
    }
    
    // Знайти назву запчастини з опису
    findPartNameFromDescription(description) {
        const descLower = description.toLowerCase();
        const partKeywords = CONSTANTS.PARTS_CONFIG;
        
        for (const partName in partKeywords) {
            const keywords = partKeywords[partName];
            for (const keyword of keywords) {
                if (descLower.includes(keyword.toLowerCase())) {
                    return partName;
                }
            }
        }
        
        return null;
    }
    
    // Отримати середній місячний пробіг (індивідуально для кожного авто)
    // Підраховує кількість робочих днів (понеділок-субота) між двома датами
    countWorkingDays(startDate, endDate) {
        if (!startDate || !endDate) return 0;
        
        let workingDays = 0;
        const currentDate = new Date(startDate);
        currentDate.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);
        
        while (currentDate <= end) {
            const dayOfWeek = currentDate.getDay(); // 0 = неділя, 1 = понеділок, ..., 6 = субота
            // Враховуємо тільки дні з понеділка (1) по суботу (6)
            if (dayOfWeek >= 1 && dayOfWeek <= 6) {
                workingDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        return workingDays;
    }

    // Розраховується за останні 5-6 місяців до сьогоднішнього дня, враховуючи тільки робочі дні (понеділок-субота)
    getAverageMonthlyMileage(car) {
        if (!car || !car.history || car.history.length < 2) return 1000; // За замовчуванням
        
        const now = new Date();
        // Використовуємо 5.5 місяців (приблизно 165 днів) як середнє між 5 і 6 місяцями
        const fiveAndHalfMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, now.getDate() - 15);
        
        // Фільтруємо історію за останні 5-6 місяців
        const recentHistory = car.history.filter(record => {
            const recordDate = this.parseDate(record.date);
            if (!recordDate) return false;
            return recordDate >= fiveAndHalfMonthsAgo;
        });
        
        if (recentHistory.length < 2) {
            // Якщо немає достатньо даних за останні 5-6 місяців, використовуємо всі дані
            const sortedHistory = [...car.history].sort((a, b) => {
                const dateA = this.parseDate(a.date) || new Date(0);
                const dateB = this.parseDate(b.date) || new Date(0);
                return dateA - dateB;
            });
            
        if (sortedHistory.length < 2) return 1000;
        
        const firstRecord = sortedHistory[0];
        const lastRecord = sortedHistory[sortedHistory.length - 1];
        
            const firstDate = this.parseDate(firstRecord.date);
            const lastDate = this.parseDate(lastRecord.date);
            
            if (!firstDate || !lastDate) return 1000;
            
            // Підраховуємо робочі дні (понеділок-субота)
            const workingDays = this.countWorkingDays(firstDate, lastDate);
            if (workingDays <= 0) return 1000;
            
        const mileageDiff = lastRecord.mileage - firstRecord.mileage;
            if (mileageDiff <= 0) return 1000;
            
            // Розраховуємо середній пробіг на робочий день, потім множимо на середню кількість робочих днів на місяць (26 днів)
            const avgMileagePerWorkingDay = mileageDiff / workingDays;
            const monthlyMileage = avgMileagePerWorkingDay * 26; // ~26 робочих днів на місяць (6 днів * 4.33 тижні)
            return monthlyMileage > 0 ? monthlyMileage : 1000;
        }
        
        // Сортуємо записи за датою
        const sortedRecentHistory = [...recentHistory].sort((a, b) => {
            const dateA = this.parseDate(a.date) || new Date(0);
            const dateB = this.parseDate(b.date) || new Date(0);
            return dateA - dateB;
        });
        
        const firstRecord = sortedRecentHistory[0];
        const lastRecord = sortedRecentHistory[sortedRecentHistory.length - 1];
        
        // Використовуємо parseDate для правильного парсингу дат
        const firstDate = this.parseDate(firstRecord.date);
        // Остання дата - це сьогодні або останній запис в історії
        const lastDate = this.parseDate(lastRecord.date);
        const endDate = lastDate > now ? now : lastDate;
        
        if (!firstDate || !endDate) return 1000;
        
        // Підраховуємо робочі дні (понеділок-субота)
        const workingDays = this.countWorkingDays(firstDate, endDate);
        if (workingDays <= 0) return 1000;
        
        const mileageDiff = lastRecord.mileage - firstRecord.mileage;
        if (mileageDiff <= 0) return 1000;
        
        // Розраховуємо середній пробіг на робочий день, потім множимо на середню кількість робочих днів на місяць (26 днів)
        const avgMileagePerWorkingDay = mileageDiff / workingDays;
        const monthlyMileage = avgMileagePerWorkingDay * 26; // ~26 робочих днів на місяць (6 днів * 4.33 тижні)
        return monthlyMileage > 0 ? monthlyMileage : 1000;
    }
    
    // Оцінка вартості для запчастини/роботи
    getEstimatedCost(partName) {
        const estimates = {
            'ТО (масло+фільтри) 🛢️': 2000,
            'ГРМ (ролики+ремінь) ⚙️': 5000,
            'Помпа 💧': 3000,
            'Обвідний ремінь+ролики 🔧': 1500,
            'Діагностика ходової 🔍': 500,
            'Розвал-сходження 📐': 400,
            'Профілактика направляючих супортів 🛠️': 800,
            "Компютерна діагностика 💻": 300,
            'Прожиг сажового фільтру 🔥': 1500,
            'Гальмівні диски передні💿': 3000,
            'Гальмівні диски задні💿': 2500,
            'Гальмівні колодки передні🛑': 1500,
            'Гальмівні колодки задні🛑': 1200,
            'Гальмівні колодки ручного гальма🛑': 800,
            'Амортизатори передні🔧': 4000,
            'Амортизатори задні🔧': 3500,
            'Опора амортизаторів 🛠️': 2000,
            'Шарова опора ⚪': 1500,
            'Рульова тяга 🔗': 1200,
            'Рульовий накінечник 🔩': 1000,
            'Зчеплення ⚙️': 8000,
            'Стартер 🔋': 3000,
            'Генератор ⚡': 4000,
            'Акумулятор 🔋': 3000
        };
        
        return estimates[partName] || 2000;
    }

    detectExpenseCategory(description) {
        if (window.EXPENSE_CATEGORIES_UTILS && window.EXPENSE_CATEGORIES_UTILS.findCategory) {
            return window.EXPENSE_CATEGORIES_UTILS.findCategory(description);
        }
        
        // Fallback метод, якщо expense-categories.js не завантажений
        const descLower = description.toLowerCase();
        
        if (descLower.includes('масл') || descLower.includes('фільтр') || descLower.includes('то')) {
            return 'ТО та обслуговування';
        } else if (descLower.includes('гальм') || descLower.includes('колодк') || descLower.includes('диск')) {
            return 'Гальмівна система';
        } else if (descLower.includes('амортизатор') || descLower.includes('підвіск') || descLower.includes('ходов')) {
            return 'Ходова частина';
        } else if (descLower.includes('двигун') || descLower.includes('грм') || descLower.includes('помп')) {
            return 'Двигун';
        } else if (descLower.includes('акб') || descLower.includes('акумулятор') || descLower.includes('стартер')) {
            return 'Електрика';
        } else if (descLower.includes('шини') || descLower.includes('колес') || descLower.includes('диагност')) {
            return 'Шини та діагностика';
        } else {
            return 'Інші витрати';
        }
    }

    prepareMonthlyChartData(byMonth, byYear, selectedYear = null) {
        // Якщо не вибрано рік - показуємо по роках
        if (!selectedYear) {
            const years = Object.keys(byYear || {}).map(y => parseInt(y)).sort();
            const maxAmount = Math.max(...Object.values(byYear || {}), 1);
            
            return years.map(year => {
                return {
                    month: year.toString(),
                    label: year.toString(),
                    amount: byYear[year] || 0,
                    height: ((byYear[year] || 0) / maxAmount * 100),
                    isYear: true
                };
            });
        }
        
        // Якщо вибрано рік - показуємо по місяцях
        let filteredMonths = Object.keys(byMonth).sort();
        filteredMonths = filteredMonths.filter(monthKey => {
            const year = parseInt(monthKey.split('-')[0]);
            return year === selectedYear;
        });
        
        const maxAmount = Math.max(...filteredMonths.map(m => byMonth[m] || 0), 1);
        
        return filteredMonths.map(monthKey => {
            const date = new Date(monthKey + '-01');
            const monthNames = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
            const label = `${monthNames[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
            
            return {
                month: monthKey,
                label: label,
                amount: byMonth[monthKey] || 0,
                height: ((byMonth[monthKey] || 0) / maxAmount * 100),
                isYear: false
            };
        });
    }

    // === НОВІ ФУНКЦІЇ: РЕКОМЕНДОВАНІ ВИРОБНИКИ ===
    getRecommendedManufacturers(partName) {
        const manufacturers = {
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
            'Рульовий накінечник 🔩': ['MEYLE', 'LEMFÖRDER']
        };

        return manufacturers[partName] || null;
    }

    // === НОВІ ФУНКЦІЇ: ПРОГНОЗ ОБСЛУГОВУВАННЯ ===
    generateMaintenanceForecast(car) {
        // Використовуємо новий модуль якщо доступний
        if (this.maintenanceForecastModule) {
            return this.maintenanceForecastModule.generateForecast(
                car,
                (license, model, year, partName) => this.findRegulationForCar(license, model, year, partName),
                (num) => this.formatNumber(num),
                this.partsForecast,
                this.maintenanceRegulations
            );
        }
        
        // Fallback до старого алгоритму
        return this.generateMaintenanceForecastOld(car);
    }

    generateMaintenanceForecastOld(car) {
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
        if (this.partsForecast) {
            try {
                useNewAlgorithm = true;
                // Отримуємо прогноз з нового алгоритму
                const forecastData = this.partsForecast.calculateForecast(
                    [car],
                    this.maintenanceRegulations,
                    (license, model, year, partName) => this.findRegulationForCar(license, model, year, partName),
                    6
                );
                
                // Перетворюємо дані з нового алгоритму в формат для відображення
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
                        
                        forecasts.push({
                            part: need.partName,
                            type: need.regulation.periodType === 'пробіг' ? 'пробіг' : 'час',
                            status: urgency,
                            when: when,
                            manufacturers: manufacturers,
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
        
        // Визначаємо категорії запчастин
        const otherParts = CONSTANTS.PARTS_ORDER.slice(8);
        const brakeParts = ['Гальмівні диски передні💿', 'Гальмівні диски задні💿', 
                           'Гальмівні колодки передні🛑', 'Гальмівні колодки задні🛑', 
                           'Гальмівні колодки ручного гальма🛑'];
        const suspensionParts = ['Амортизатори передні🔧', 'Амортизатори задні🔧', 
                                'Опора амортизаторів 🛠️', 'Шарова опора ⚪', 
                                'Рульова тяга 🔗', 'Рульовий накінечник 🔩'];
        const excludedParts = ['Стартер 🔋', 'Генератор ⚡', 'Акумулятор 🔋'];
        
        // Перевіряємо запчастини з категорії "Інші запчастини"
        let hasBrakeIssue = false;
        let hasSuspensionIssue = false;
        
        for (const partName of otherParts) {
            const part = car.parts[partName];
            if (part && (part.status === 'critical' || part.status === 'warning')) {
                if (brakeParts.includes(partName)) {
                    hasBrakeIssue = true;
                } else if (suspensionParts.includes(partName)) {
                    hasSuspensionIssue = true;
                }
            }
        }
        
        if (hasBrakeIssue) {
            forecasts.push({
                part: 'Зробити профілактику направляючих та перевірити стан гальмівної системи',
                type: 'рекомендація',
                status: 'warning',
                                when: 'Це лише прогноз, але бажано звернути увагу найближчим часом'
            });
        }
        
        if (hasSuspensionIssue) {
            forecasts.push({
                part: 'Зробити діагностику ходової частини',
                type: 'рекомендація',
                status: 'warning',
                                when: 'Це лише прогноз, але бажано звернути увагу найближчим часом'
            });
        }
        
        // Аналізуємо кожну запчастину
        for (const partName in car.parts) {
            const part = car.parts[partName];
            if (!part) continue;
            
            // Пропускаємо виключені запчастини
            if (excludedParts.includes(partName)) continue;
            
            // Пропускаємо "Прожиг сажового фільтру" якщо потрібно
            if (shouldHideSootBurn && partName === 'Прожиг сажового фільтру 🔥') {
                continue;
            }
            
            // Для робіт: включаємо якщо статус червоний або помаранчевий
            const isWork = ['Діагностика ходової 🔍', 'Розвал-сходження 📐', 'Профілактика направляючих супортів 🛠️',
                               "Компютерна діагностика 💻", 'Прожиг сажового фільтру 🔥', 'ТО (масло+фільтри) 🛢️'].includes(partName);
            
            if (isWork && (part.status === 'critical' || part.status === 'warning')) {
                forecasts.push({
                    part: partName,
                    type: 'статус',
                    status: part.status,
                                when: 'Це лише прогноз, але бажано звернути увагу найближчим часом'
                });
                continue;
            }
            
            // Знаходимо регламент для цієї деталі
            const regulation = this.findRegulationForCar(car.license, car.model, car.year, partName);
            
            if (regulation && regulation.normalValue !== 'chain') {
                let nextMaintenance = null;
                let isPast = false;
                
                if (regulation.periodType === 'пробіг') {
                    const remainingKm = regulation.normalValue - part.mileageDiff;
                    isPast = remainingKm < 0;
                    
                    if (remainingKm < 5000) {
                        // Якщо в минулому - визначаємо термін на основі статусу
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
                                    when: `через ${this.formatNumber(Math.max(0, remainingKm))} км`
                                };
                            }
                        } else {
                            nextMaintenance = {
                                part: partName,
                                type: 'пробіг',
                                status: part.status,
                                when: `через ${this.formatNumber(Math.max(0, remainingKm))} км`
                            };
                        }
                    }
                } else if (regulation.periodType === 'місяць') {
                    const remainingMonths = regulation.normalValue - Math.floor(part.daysDiff / 30);
                    isPast = remainingMonths < 0;
                    
                    if (remainingMonths < 3) {
                        // Якщо в минулому - визначаємо термін на основі статусу
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
                    // Додаємо рекомендованих виробників
                    const manufacturers = this.getRecommendedManufacturers(partName);
                    if (manufacturers) {
                        nextMaintenance.manufacturers = manufacturers;
                    }
                    forecasts.push(nextMaintenance);
                }
            }
        }
        } // Закриваємо if (!useNewAlgorithm)
        
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

    // === ГЕНЕРАЦІЯ HTML ДЛЯ ДЕТАЛЬНОГО ПЕРЕГЛЯДУ АВТО ===
    generateCarDetailHTML(car) {
        const { selectedHistoryPartFilter, historySearchTerm } = this.state;
        let displayHistory = this.filterCarHistory(car.history, selectedHistoryPartFilter, historySearchTerm);
        // Сортуємо від більшої дати до меншої
        displayHistory = displayHistory.sort((a, b) => {
            const dateA = this.parseDate(a.date) || new Date(0);
            const dateB = this.parseDate(b.date) || new Date(0);
            return dateB - dateA; // Від більшої до меншої
        });
        const partNames = CONSTANTS.PARTS_ORDER;
        
        // Розраховуємо статистику витрат
        const selectedYear = this.state.selectedYear || null;
        const costStats = this.calculateCostStats(car.history, car, selectedYear);
        const healthScore = this.calculateHealthScore(car);
        const maintenanceForecast = this.generateMaintenanceForecast(car);

        return `
            <div class="min-h-screen bg-gray-50">
                <div class="sticky top-0 z-40 bg-gradient-to-b from-slate-900 via-blue-900/90 to-slate-900/90 backdrop-blur-sm border-b border-blue-700/30">
                    <div class="px-3 sm:px-4 py-1">
                        <button onclick="app.setState({ selectedCar: null, selectedHistoryPartFilter: null, historySearchTerm: '' });"
                                class="bg-white text-blue-600 font-semibold px-4 py-1.5 rounded-lg shadow-lg flex items-center gap-2 mb-1 text-sm hover:bg-gray-50">
                            ← Назад до списку
                        </button>
                        <div class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-2xl p-1.5">
                            <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                <div class="flex items-center gap-2 flex-1">
                                    <div class="bg-white/20 p-1.5 rounded-xl text-xl">🚗</div>
                                    <div class="flex-1">
                                        <div class="text-white text-base font-bold">${car.license}</div>
                                        <div class="text-blue-100 text-xs">${car.model || 'Немає моделі'}</div>
                                        <div class="text-blue-200 text-xs">
                                            ${car.year ? car.year + ' рік' : ''}
                                            ${car.year && car.city ? ' • ' : ''}
                                            ${car.city || ''}
                                        </div>
                                    </div>
                                </div>
                                <div class="flex items-center gap-3">
                                    <div class="text-center">
                                        <div class="text-blue-100 text-xs mb-0.5">Стан авто</div>
                                        <div class="flex items-center gap-1.5">
                                            <div class="w-10 h-1 bg-gray-700 rounded-full overflow-hidden">
                                                <div class="h-full bg-gradient-to-r ${this.getHealthScoreColor(healthScore)} rounded-full" 
                                                     style="width: ${healthScore}%"></div>
                                            </div>
                                            <span class="text-white text-xs font-bold">${healthScore}%</span>
                                        </div>
                                        <div class="text-blue-200 text-xs mt-0.5">${this.getHealthScoreStatus(healthScore)}</div>
                                    </div>
                                    ${this.generateMileageStatsInline(car)}
                                    <div class="text-center">
                                        <div class="text-blue-100 text-xs mb-0.5">Пробіг</div>
                                        <div class="text-white text-sm font-bold">${this.formatMileage(car.currentMileage)}</div>
                                        <div class="text-blue-200 text-xs mt-0.5">📋 ${car.history.length}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-full px-3 sm:px-4 pt-4">
                    <!-- Панель швидких дій -->
                    ${this.generateQuickActions(car)}
                    
                    <div class="bg-white rounded-xl shadow-xl p-3 sm:p-4 mb-4 border border-gray-200">
                        ${this.generateCarPartsHTML(car, partNames)}
                    </div>

                    <!-- Новий блок: Карта стану авто -->
                    ${this.generatePartsStatusMap(car)}

                    <!-- Блок: Необхідні дії, рекомендації та поради -->
                    <div class="bg-white rounded-xl shadow-xl p-3 sm:p-4 mb-4 border border-gray-200">
                        ${this.generateCostRecommendations(car, costStats)}
                    </div>

                    <!-- Новий блок: Прогноз обслуговування -->
                    ${maintenanceForecast.length > 0 ? (this.maintenanceForecastModule ? 
                        this.maintenanceForecastModule.generateForecastHTML(maintenanceForecast) :
                        this.generateMaintenanceForecastHTMLOld(maintenanceForecast)) : ''}

                    <div class="bg-white rounded-xl shadow-xl p-3 sm:p-4 mb-4 border border-gray-200">
                        ${this.generateCarHistoryHTML(car, displayHistory)}
                    </div>

                    <!-- Новий блок: Графік витрат -->
                    <div class="bg-white rounded-xl shadow-xl p-3 sm:p-4 mb-4 border border-gray-200">
                        ${this.generateCostChartHTML(car, costStats)}
                    </div>
                </div>
            </div>
        `;
    }

    generateCarPartsHTML(car, partNames) {
        // Фільтруємо "Прожиг сажового фільтру" для авто року < 2010 та Fiat Tipo, Peugeot 301, Hyundai Accent
        const carYear = parseInt(car.year) || 0;
        const carModel = (car.model || '').toUpperCase();
        const shouldHideSootBurn = carYear < 2010 || 
                                   carModel.includes('FIAT TIPO') || 
                                   carModel.includes('PEUGEOT 301') || 
                                   carModel.includes('HYUNDAI ACCENT');
        
        // Фільтруємо "Свічки запалювання" - показуємо тільки для Peugeot, Hyundai, Fiat
        const shouldShowSparkPlugs = /PEUGEOT|HYUNDAI|FIAT/.test(carModel);
        
        let filteredPartNames = shouldHideSootBurn 
            ? partNames.filter(name => name !== 'Прожиг сажового фільтру 🔥')
            : partNames;
        
        // Приховуємо свічки запалювання, якщо авто не Peugeot, Hyundai, Fiat
        if (!shouldShowSparkPlugs) {
            filteredPartNames = filteredPartNames.filter(name => name !== 'Свічки запалювання 🔥');
        }
        
        const importantParts = filteredPartNames.slice(0, 8);
        const otherParts = filteredPartNames.slice(8);

        return `
            <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>🔧</span> Стан запчастин
                ${this.state.selectedHistoryPartFilter || this.state.historySearchTerm ? `
                    <button onclick="app.setState({ selectedHistoryPartFilter: null, historySearchTerm: '' });"
                            class="ml-auto bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors">
                        ✕ Скинути всі фільтри
                    </button>
                ` : ''}
            </h3>

            <div class="mb-4">
                <h4 class="text-base font-semibold text-blue-600 mb-2">⚡ Важливі категорії</h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    ${importantParts.map(partName => this.generatePartCard(car, partName)).join('')}
                </div>
            </div>

            <div>
                <h4 class="text-base font-semibold text-gray-600 mb-2">🔩 Інші запчастини</h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    ${otherParts.map(partName => this.generatePartCard(car, partName, true)).join('')}
                </div>
            </div>
        `;
    }

    generatePartCard(car, partName, small = false) {
        const part = car.parts[partName];
        const isActive = this.state.selectedHistoryPartFilter === partName;
        const isImportantCategory = !small; // Важливі категорії - це ті, що не small

        // Перевірка для ГРМ: чи це авто з ланцюговим приводом ГРМ
        // Для авто: Mercedes-Benz Sprinter, Iveco Daily 65C15, Isuzu nqr 71R, Hyundai Accent
        const chainDriveModels = ['mercedes-benz sprinter', 'iveco daily 65c15', 'isuzu nqr 71r', 'hyundai accent'];
        const isChainDriveGRM = partName === 'ГРМ (ролики+ремінь) ⚙️' && 
                                car.model && chainDriveModels.some(model => car.model.toLowerCase().includes(model));

        let borderClass = !part ? 'border-gray-200' :
                         part.status === 'critical' ? 'border-red-300' :
                         part.status === 'warning' ? 'border-orange-300' : 'border-green-300';

        let bgClass = !part ? 'bg-gray-50' :
                     part.status === 'critical' ? 'bg-red-50' :
                     part.status === 'warning' ? 'bg-orange-50' : 'bg-green-50';

        let textClass = !part ? 'text-gray-400' :
                       part.status === 'critical' ? 'text-red-600' :
                       part.status === 'warning' ? 'text-orange-600' : 'text-green-600';

        const activeClass = isActive ? 'border-2 border-blue-500 ring-2 ring-blue-200' : '';
        const formattedDate = part ? this.formatDate(part.date) : '';

        const cardClass = small ? 'p-2 rounded border' : 'p-3 rounded-lg border';
        const textSize = small ? 'text-xs' : 'text-sm';

        // Розраховуємо наступну заміну/обслуговування для важливих категорій
        let nextReplacementInfo = '';
        if (isImportantCategory && part && !isChainDriveGRM) {
            nextReplacementInfo = this.getNextReplacementInfo(car, partName, part);
        }

        return `
            <div class="${cardClass} ${borderClass} ${bgClass} cursor-pointer hover:shadow transition-all ${activeClass}"
                 onclick="app.setState({ selectedHistoryPartFilter: app.state.selectedHistoryPartFilter === '${partName}' ? null : '${partName}' });">
                <div class="font-bold text-gray-800 ${textSize} mb-1 flex items-center justify-between">
                    <span class="truncate" title="${partName}">${partName}</span>
                    ${isActive ? '<span class="text-blue-500 text-xs flex-shrink-0 ml-1">📌</span>' : ''}
                </div>
                ${isChainDriveGRM ? `
                    <div class="${small ? 'space-y-0.5' : 'space-y-1'}">
                        <div class="text-center py-2">
                            <div class="text-xs sm:text-sm font-bold text-gray-700 italic">
                                Ланцюговий привід ГРМ — регламентної заміни не потребує
                            </div>
                        </div>
                    </div>
                ` : part ? `
                    <div class="${small ? 'space-y-0.5' : 'space-y-1'}">
                        <div class="flex justify-between items-center">
                            <div class="text-xs text-gray-700 font-bold">📅 Дата заміни:</div>
                            <div class="font-extrabold text-gray-900 text-xs sm:text-sm">${formattedDate}</div>
                        </div>
                        <div class="flex justify-between items-center">
                            <div class="text-xs text-gray-700 font-bold">🛣️ Пробіг при заміні:</div>
                            <div class="text-xs sm:text-sm font-extrabold text-gray-900">${this.formatMileage(part.mileage)}</div>
                        </div>
                        <div class="text-center my-1">
                            <div class="text-xs text-gray-600 mb-0.5">Пробіг після заміни:</div>
                            <div class="${small ? 'text-sm sm:text-base' : 'text-lg sm:text-xl'} font-extrabold ${textClass}">
                                ${this.formatMileageDiff(part.mileageDiff)}
                            </div>
                        </div>
                        <div class="flex justify-between items-center">
                            <div class="text-xs text-gray-700 font-bold">⏰ Минуло часу:</div>
                            <div class="text-xs sm:text-sm font-extrabold text-gray-900">${part.timeDiff}</div>
                        </div>
                            ${nextReplacementInfo ? `
                                <div class="mt-2 pt-2 border-t border-gray-300">
                                    <div class="text-xs font-bold text-gray-700">${nextReplacementInfo}</div>
                                </div>
                            ` : ''}
                    </div>
                ` : '<div class="text-gray-300 text-xs text-center py-2">Немає даних</div>'}
            </div>
        `;
    }

    getNextReplacementInfo(car, partName, part) {
        if (!part) return '';
        
        // Запчастини з пробігом: ТО, ГРМ, Обвідний ремінь+ролики, Помпа
        const mileageBasedParts = [
            'ТО (масло+фільтри) 🛢️',
            'ГРМ (ролики+ремінь) ⚙️',
            'Обвідний ремінь+ролики 🔧',
            'Помпа 💧'
        ];

        // Роботи з датами: Діагностика ходової, Розвал-сходження, Профілактика направляючих супортів, Комп'ютерна діагностика
        const dateBasedParts = [
            'Діагностика ходової 🔍',
            'Розвал-сходження 📐',
            'Профілактика направляючих супортів 🛠️',
            "Компютерна діагностика 💻",
            "Комп'ютерна діагностика 💻" // Альтернативна назва з апострофом
        ];

        const regulation = this.findRegulationForCar(car.license, car.model, car.year, partName);
        
        if (mileageBasedParts.includes(partName)) {
            // Стандартні значення для запчастин з пробігом (якщо регламент не знайдено)
            const defaultMileage = {
                'ТО (масло+фільтри) 🛢️': 15000,
                'ГРМ (ролики+ремінь) ⚙️': 60000,
                'Обвідний ремінь+ролики 🔧': 60000,
                'Помпа 💧': 60000
            };
            
            let normalValue;
            // Використовуємо значення зі стовпця H ("У нормі") листа "Регламент ТО"
            if (regulation && regulation.normalValue !== 'chain' && regulation.periodType === 'пробіг') {
                normalValue = regulation.normalValue; // Значення зі стовпця H
            } else {
                // Якщо регламент не знайдено, використовуємо стандартне значення
                normalValue = defaultMileage[partName] || 15000;
            }
            
            // Для "Помпа" і "Обвідний ремінь+ролики": перевіряємо, чи є ланцюговий ГРМ
            if (partName === 'Помпа 💧' || partName === 'Обвідний ремінь+ролики 🔧') {
                // Перевіряємо, чи це авто з ланцюговим приводом ГРМ
                const chainDriveModels = ['mercedes-benz sprinter', 'iveco daily 65c15', 'isuzu nqr 71r', 'hyundai accent'];
                const isChainDriveGRM = car.model && chainDriveModels.some(model => car.model.toLowerCase().includes(model));
                
                // Якщо це НЕ авто з ланцюговим ГРМ, перевіряємо регламенти
                if (!isChainDriveGRM) {
                    const grmRegulation = this.findRegulationForCar(car.license, car.model, car.year, 'ГРМ (ролики+ремінь) ⚙️');
                    if (grmRegulation && grmRegulation.normalValue !== 'chain' && grmRegulation.periodType === 'пробіг') {
                        // Якщо значення відрізняються від ГРМ, використовуємо значення з ГРМ для наступної заміни
                        if (grmRegulation.normalValue !== normalValue) {
                            normalValue = grmRegulation.normalValue;
                        }
                    }
                }
                // Якщо це авто з ланцюговим ГРМ - використовуємо регламент Помпи/Обвідного реміння (normalValue вже встановлено вище)
            }
            
            // Розраховуємо наступну заміну на основі пробігу (використовуючи значення зі стовпця H)
            const remainingKm = normalValue - part.mileageDiff;
            const nextMileage = car.currentMileage + remainingKm;
            
            if (remainingKm <= 0) {
                // Для ТО, ГРМ, Помпа, Обвідний ремінь використовуємо спеціальний текст
                const specialParts = [
                    'ТО (масло+фільтри) 🛢️',
                    'ГРМ (ролики+ремінь) ⚙️',
                    'Помпа 💧',
                    'Обвідний ремінь+ролики 🔧'
                ];
                if (specialParts.includes(partName)) {
                    return 'Уже пора міняти 👨‍🔧';
                }
                return 'Наступна заміна: вже потрібна';
            } else {
                return `Наступна заміна на ${this.formatMileage(nextMileage)} км`;
            }
        } else if (dateBasedParts.includes(partName)) {
            // Стандартні значення для робіт з датами (якщо регламент не знайдено)
            const defaultMonths = {
                'Діагностика ходової 🔍': 6,
                'Розвал-сходження 📐': 12,
                'Профілактика направляючих супортів 🛠️': 6,
                "Компютерна діагностика 💻": 6,
                "Комп'ютерна діагностика 💻": 6
            };
            
            let normalValue;
            let periodType = 'місяць';
            
            // Використовуємо значення зі стовпця H ("У нормі") листа "Регламент ТО"
            if (regulation && regulation.normalValue !== 'chain') {
                normalValue = regulation.normalValue; // Значення зі стовпця H
                periodType = regulation.periodType || 'місяць';
            } else {
                // Якщо регламент не знайдено, використовуємо стандартне значення
                normalValue = defaultMonths[partName] || 6;
            }
            
            // Якщо periodType не 'місяць', але це важливі категорії - використовуємо стандартне значення
            if (periodType !== 'місяць') {
                normalValue = defaultMonths[partName] || 6;
            }
            
            // Розраховуємо наступне обслуговування на основі місяців (використовуючи значення зі стовпця H)
            const remainingMonths = normalValue - Math.floor(part.daysDiff / 30);
            
            // Для Діагностика ходової та Розвал-сходження: якщо помаранчевий або червоний - "Виконати протягом тижня ⏳"
            if ((partName === 'Діагностика ходової 🔍' || partName === 'Розвал-сходження 📐') && 
                (part.status === 'warning' || part.status === 'critical')) {
                return 'Виконати протягом тижня ⏳';
            }
            
            // Для Профілактика направляючих супортів та Комп'ютерна діагностика: якщо помаранчевий - "Виконати протягом тижня ⏳"
            if ((partName === 'Профілактика направляючих супортів 🛠️' || 
                 partName === "Компютерна діагностика 💻" || 
                 partName === "Комп'ютерна діагностика 💻") && 
                part.status === 'warning') {
                return 'Виконати протягом тижня ⏳';
            }
            
            if (remainingMonths <= 0) {
                return 'Виконати протягом тижня ⏳';
            }
            
            // Розраховуємо дату наступного обслуговування
            const nextDate = new Date();
            nextDate.setMonth(nextDate.getMonth() + remainingMonths);
            
            const monthNames = ['січень', 'лютий', 'березень', 'квітень', 'травень', 'червень',
                              'липень', 'серпень', 'вересень', 'жовтень', 'листопад', 'грудень'];
            const monthName = monthNames[nextDate.getMonth()];
            
            return `Наступна перевірка: ${monthName}`;
        }

        return '';
    }

    generateCostChartHTML(car, costStats) {
        const selectedYear = this.state.selectedYear;
        
        // Отримуємо список доступних років з повної історії (без фільтру року)
        const fullCostStats = this.calculateCostStats(car.history, car, null);
        const availableYears = Object.keys(fullCostStats.byYear || {}).map(y => parseInt(y)).sort((a, b) => b - a);
        const currentYear = new Date().getFullYear();
        if (!availableYears.includes(currentYear)) {
            availableYears.unshift(currentYear);
        }
        
        const monthlyData = this.prepareMonthlyChartData(costStats.byMonth, costStats.byYear, selectedYear);
        
        // Розраховуємо загальну суму за вибраний рік або за всі роки
        const totalForPeriod = selectedYear ? (costStats.byYear[selectedYear] || 0) : costStats.totalSpent;
        
        return `
            <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>💰</span> Аналіз витрат
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <!-- Статистика -->
                <div class="space-y-3 order-1 md:order-1">
                    <div class="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                        <span class="font-semibold text-blue-800">Загалом витрачено:</span>
                        <span class="text-xl font-bold text-blue-600">${this.formatPrice(costStats.totalSpent)} ₴</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                        <span class="font-semibold text-green-800">За останній рік:</span>
                        <span class="text-xl font-bold text-green-600">${this.formatPrice(costStats.lastYearSpent)} ₴</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                        <span class="font-semibold text-purple-800">Середньомісячно:</span>
                        <span class="text-xl font-bold text-purple-600">${this.formatPrice(costStats.averagePerMonth)} ₴</span>
                    </div>
                    
                    <div class="flex justify-between items-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                        <span class="font-semibold text-orange-800">Прогноз на 6 міс:</span>
                        <span class="text-xl font-bold text-orange-600">${this.formatPrice(costStats.predictions.next6Months)} ₴</span>
                    </div>
                </div>
                
                <!-- Стовпчастий графік витрат по роках/місяцях -->
                <div class="p-3 bg-gray-50 rounded-lg order-2 md:order-2 relative">
                    <div class="flex items-center justify-between mb-2">
                        <div class="text-xs font-semibold text-gray-700">📊 Розподіл по категоріях</div>
                        <div class="text-xs text-gray-600">📅 Період:</div>
                        <select onchange="app.setState({ selectedYear: this.value === 'all' ? null : parseInt(this.value) }); app.render();" 
                                class="ml-2 text-xs border border-gray-300 rounded px-2 py-1 bg-white text-gray-700">
                            <option value="all" ${!selectedYear ? 'selected' : ''}>Всі роки</option>
                            ${availableYears.map(year => `
                                <option value="${year}" ${selectedYear === year ? 'selected' : ''}>${year}</option>
                            `).join('')}
                        </select>
                    </div>
                    ${(() => {
                        if (!monthlyData || monthlyData.length === 0) {
                            return '<div class="text-center text-gray-500 text-sm py-8">Немає даних для відображення</div>';
                        }
                        
                        const chartWidth = 600;
                        const chartHeight = 200;
                        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
                        const graphWidth = chartWidth - padding.left - padding.right;
                        const graphHeight = chartHeight - padding.top - padding.bottom;
                        const maxAmount = Math.max(...monthlyData.map(d => d.amount), 1);
                        const barWidth = graphWidth / monthlyData.length * 0.7;
                        const barSpacing = graphWidth / monthlyData.length;
                        
                        // Розраховуємо лінію тренду (лінійна регресія)
                        let trendLine = '';
                        let avgAmount = 0;
                        let trendDirection = ''; // 'up', 'down', 'stable'
                        
                        if (monthlyData.length > 1) {
                            // Обчислюємо середнє значення
                            avgAmount = monthlyData.reduce((sum, d) => sum + d.amount, 0) / monthlyData.length;
                            
                            // Розраховуємо лінійну регресію для визначення напрямку тренду
                            const n = monthlyData.length;
                            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
                            
                            monthlyData.forEach((d, idx) => {
                                const x = idx;
                                const y = d.amount;
                                sumX += x;
                                sumY += y;
                                sumXY += x * y;
                                sumX2 += x * x;
                            });
                            
                            const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
                            const intercept = (sumY - slope * sumX) / n;
                            
                            // Визначаємо напрямок тренду
                            const threshold = 0.05; // 5% від середнього для визначення стабільності
                            if (Math.abs(slope) < avgAmount * threshold / n) {
                                trendDirection = 'stable';
                            } else if (slope > 0) {
                                trendDirection = 'up';
                            } else {
                                trendDirection = 'down';
                            }
                            
                            // Розраховуємо координати для лінії тренду
                            const x1 = padding.left;
                            const y1 = padding.top + graphHeight - ((intercept) / maxAmount * graphHeight);
                            const x2 = padding.left + graphWidth;
                            const y2 = padding.top + graphHeight - ((slope * (n - 1) + intercept) / maxAmount * graphHeight);
                            
                            // Визначаємо колір та іконку залежно від напрямку
                            let trendColor = '#6b7280'; // сірий для стабільного
                            let trendIcon = '➡️';
                            let trendText = 'Стабільно';
                            
                            if (trendDirection === 'up') {
                                trendColor = '#ef4444'; // червоний для зростання
                                trendIcon = '📈';
                                trendText = 'Зростання';
                            } else if (trendDirection === 'down') {
                                trendColor = '#10b981'; // зелений для падіння
                                trendIcon = '📉';
                                trendText = 'Зниження';
                            }
                            
                            // Малюємо лінію тренду
                            trendLine = `
                                <line 
                                    x1="${x1}" 
                                    y1="${y1}" 
                                    x2="${x2}" 
                                    y2="${y2}" 
                                    stroke="${trendColor}" 
                                    stroke-width="2" 
                                    stroke-dasharray="5,5" 
                                    opacity="0.7"
                                />
                                <text 
                                    x="${padding.left + graphWidth - 5}" 
                                    y="${Math.min(y1, y2) - 5}" 
                                    fill="${trendColor}" 
                                    font-size="10" 
                                    text-anchor="end"
                                    font-weight="bold"
                                >${trendIcon} ${trendText}</text>
                            `;
                        } else if (monthlyData.length === 1) {
                            avgAmount = monthlyData[0].amount;
                        }
                        
                        return `
                            <div class="overflow-x-auto">
                                <svg width="${chartWidth}" height="${chartHeight}" viewBox="0 0 ${chartWidth} ${chartHeight}" class="w-full">
                                    <!-- Сітка -->
                                    ${Array.from({ length: 5 }).map((_, i) => {
                                        const y = padding.top + (graphHeight / 4) * i;
                                        const value = maxAmount - (maxAmount / 4) * i;
                                        return `
                                            <line 
                                                x1="${padding.left}" 
                                                y1="${y}" 
                                                x2="${padding.left + graphWidth}" 
                                                y2="${y}" 
                                                stroke="#e5e7eb" 
                                                stroke-width="1"
                                            />
                                            <text 
                                                x="${padding.left - 5}" 
                                                y="${y + 4}" 
                                                fill="#6b7280" 
                                                font-size="10" 
                                                text-anchor="end"
                                            >${this.formatPrice(value)}</text>
                                        `;
                                    }).join('')}
                                    
                                    <!-- Лінія тренду -->
                                    ${trendLine}
                                    
                                    <!-- Стовпці -->
                                    ${monthlyData.map((data, idx) => {
                                        const x = padding.left + idx * barSpacing + (barSpacing - barWidth) / 2;
                                        const barHeight = (data.amount / maxAmount) * graphHeight;
                                        const y = padding.top + graphHeight - barHeight;
                                        const color = selectedYear ? '#3b82f6' : '#10b981';
                                        
                                        return `
                                            <g>
                                                <rect 
                                                    x="${x}" 
                                                    y="${y}" 
                                                    width="${barWidth}" 
                                                    height="${barHeight}" 
                                                    fill="${color}" 
                                                    class="transition-all duration-300 hover:opacity-80 cursor-pointer"
                                                    data-label="${data.label}"
                                                    data-amount="${data.amount}"
                                                />
                                                <text 
                                                    x="${x + barWidth / 2}" 
                                                    y="${y - 5}" 
                                                    fill="#374151" 
                                                    font-size="10" 
                                                    text-anchor="middle"
                                                    font-weight="bold"
                                                >${this.formatPrice(data.amount)}</text>
                                                <text 
                                                    x="${x + barWidth / 2}" 
                                                    y="${chartHeight - padding.bottom + 15}" 
                                                    fill="#6b7280" 
                                                    font-size="9" 
                                                    text-anchor="middle"
                                                    transform="rotate(-45 ${x + barWidth / 2} ${chartHeight - padding.bottom + 15})"
                                                >${data.label}</text>
                                            </g>
                                        `;
                                    }).join('')}
                                </svg>
                                    </div>
                            <div class="mt-2 text-center">
                        <div class="text-sm font-bold">
                            <span class="text-blue-600">Всього: ${this.formatPrice(totalForPeriod)} ₴</span>
                            ${avgAmount > 0 ? ` <span class="text-purple-600">| Середнє: ${this.formatPrice(avgAmount)} ₴</span>` : ''}
                                </div>
                            </div>
                        `;
                    })()}
                </div>
            </div>
            
            <!-- Розподіл по категоріях та Частота поломок -->
            <div class="mt-4">
                <!-- Заголовки на одному рівні -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    <h4 class="font-semibold text-gray-700 flex items-center gap-2">
                        <span>📋</span> Розподіл витрат по категоріях
                    </h4>
                    <h4 class="font-semibold text-gray-700 flex items-center gap-2">
                        <span>📊</span> Частота поломок по категоріях
                    </h4>
                </div>
                
                <!-- Контент в одному блоці -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <!-- Розподіл витрат -->
                    <div>
                        <div class="space-y-3">
                    ${Object.entries(costStats.byCategory)
                        .sort((a, b) => b[1] - a[1])
                        .map(([category, amount]) => {
                            const percentage = costStats.totalSpent > 0 ? (amount / costStats.totalSpent * 100).toFixed(1) : 0;
                                    const maxAmount = Math.max(...Object.values(costStats.byCategory));
                                    const barWidth = maxAmount > 0 ? (amount / maxAmount * 100) : 0;
                                    
                            return `
                                        <div class="space-y-1">
                                <div class="flex items-center justify-between">
                                                <span class="text-sm text-gray-700 font-medium">${category}</span>
                                    <div class="flex items-center gap-2">
                                                    <span class="text-xs text-gray-500">${this.formatPrice(amount)} ₴</span>
                                                    <span class="text-xs font-semibold text-gray-600">${percentage}%</span>
                                        </div>
                                            </div>
                                            <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                                <div class="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500" 
                                                     style="width: ${barWidth}%"></div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        </div>
                        <div class="mt-3 pt-3 border-t border-gray-200">
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-600">Всього витрачено:</span>
                                <span class="font-bold text-gray-800">${this.formatPrice(costStats.totalSpent)} ₴</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Частота поломок -->
                    <div>
                        ${this.generateBreakdownFrequencyChartContent(car)}
                    </div>
                </div>
            </div>
        `;
    }

    generateCostRecommendations(car, costStats) {
        // Використовуємо новий модуль якщо доступний
        if (this.carRecommendations) {
            const recommendations = this.carRecommendations.generateRecommendations(
                car,
                costStats,
                () => this.getAverageMonthlyMileage(car),
                (mileage) => this.formatMileage(mileage),
                this.carWashChecker,
                (license, model, year, partName) => this.findRegulationForCar(license, model, year, partName),
                (car, partName, part) => this.getNextReplacementInfo(car, partName, part)
            );
            return this.carRecommendations.generateRecommendationsHTML(recommendations);
        }
        
        // Fallback (не повинно досягти цього коду)
        return '<div class="mt-6 p-4">Рекомендації недоступні</div>';
    }

    // === НОВІ ФУНКЦІЇ: ГРАФІК ЧАСТОТИ ПОЛОМОК ===
    generateBreakdownFrequencyChart(car) {
        if (!this.breakdownAnalysis) {
            return '';
        }

        const filters = {
            selectedYear: this.state.selectedYear,
            selectedCity: this.state.selectedCity
        };

        // Аналізуємо тільки поточне авто
        const stats = this.breakdownAnalysis.analyzeBreakdownFrequency([car], filters);
        return this.breakdownAnalysis.generateBreakdownFrequencyChartHTML(stats, (amount) => this.formatPrice(amount));
    }

    // Генерує тільки контент графіка частоти поломок (без заголовка)
    generateBreakdownFrequencyChartContent(car) {
        if (!this.breakdownAnalysis) {
            return '<div class="text-sm text-gray-500 text-center">Немає даних</div>';
        }

        const filters = {
            selectedYear: this.state.selectedYear,
            selectedCity: this.state.selectedCity
        };

        const stats = this.breakdownAnalysis.analyzeBreakdownFrequency([car], filters);
        
        if (!stats || stats.totalBreakdowns === 0) {
            return '<div class="text-sm text-gray-500 text-center">Немає даних для відображення</div>';
        }

        const sortedCategories = Object.entries(stats.byCategory)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        const maxFrequency = Math.max(...sortedCategories.map(([_, count]) => count));

        return `
            <div class="space-y-3">
                ${sortedCategories.map(([category, count]) => {
                    const percentage = (count / stats.totalBreakdowns * 100).toFixed(1);
                    const barWidth = maxFrequency > 0 ? (count / maxFrequency * 100) : 0;
                    
                    return `
                        <div class="space-y-1">
                            <div class="flex items-center justify-between">
                                <span class="text-sm text-gray-700 font-medium">${category}</span>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-gray-500">${count} разів</span>
                                    <span class="text-xs font-semibold text-gray-600">${percentage}%</span>
                                </div>
                            </div>
                            <div class="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 rounded-full transition-all duration-500" 
                                     style="width: ${barWidth}%"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="mt-3 pt-3 border-t border-gray-200">
                <div class="flex justify-between items-center text-sm">
                    <span class="text-gray-600">Всього поломок:</span>
                    <span class="font-bold text-gray-800">${stats.totalBreakdowns}</span>
                </div>
            </div>
        `;
    }

    // === НОВІ ФУНКЦІЇ: СЕРЕДНІЙ ПРОБІГ В ШАПЦІ ===
    generateMileageStatsInline(car) {
        const avgMonthlyMileage = this.getAverageMonthlyMileage(car);
        const avgDailyMileage = Math.round(avgMonthlyMileage / 30);
        const avgWeeklyMileage = Math.round(avgMonthlyMileage / 4.33);
        const avgYearlyMileage = Math.round(avgMonthlyMileage * 12);
        
        return `
            <div class="text-center">
                <div class="text-blue-100 text-xs mb-0.5">Середній пробіг</div>
                <div class="flex flex-col items-start gap-0.5 text-xs text-blue-100">
                    <div class="flex items-center gap-1.5 w-full">
                        <span class="w-5 text-center">📅</span>
                        <span class="font-semibold text-white">${this.formatMileage(avgDailyMileage)}/день</span>
                    </div>
                    <div class="flex items-center gap-1.5 w-full">
                        <span class="w-5 text-center">📆</span>
                        <span class="font-semibold text-white">${this.formatMileage(avgWeeklyMileage)}/тиждень</span>
                    </div>
                    <div class="flex items-center gap-1.5 w-full">
                        <span class="w-5 text-center">📊</span>
                        <span class="font-semibold text-white">${this.formatMileage(avgMonthlyMileage)}/місяць</span>
                    </div>
                    <div class="flex items-center gap-1.5 w-full">
                        <span class="w-5 text-center">🗓️</span>
                        <span class="font-semibold text-white">${this.formatMileage(avgYearlyMileage)}/рік</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    generateMileageStatsHeader(car) {
        const avgMonthlyMileage = this.getAverageMonthlyMileage(car);
        const avgDailyMileage = Math.round(avgMonthlyMileage / 30);
        const avgWeeklyMileage = Math.round(avgMonthlyMileage / 4.33);
        const avgYearlyMileage = Math.round(avgMonthlyMileage * 12);
        
        return `
            <div class="mt-2 pt-2 border-t border-blue-700/30">
                <div class="flex flex-wrap items-center justify-center gap-3 text-xs text-blue-100">
                    <div class="flex items-center gap-1">
                        <span>📅</span>
                        <span class="font-semibold">${this.formatMileage(avgDailyMileage)}/день</span>
                        </div>
                    <div class="flex items-center gap-1">
                        <span>📆</span>
                        <span class="font-semibold">${this.formatMileage(avgWeeklyMileage)}/тиждень</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <span>📊</span>
                        <span class="font-semibold">${this.formatMileage(avgMonthlyMileage)}/місяць</span>
                    </div>
                    <div class="flex items-center gap-1">
                        <span>🗓️</span>
                        <span class="font-semibold">${this.formatMileage(avgYearlyMileage)}/рік</span>
                    </div>
                </div>
            </div>
        `;
    }

    // === НОВІ ФУНКЦІЇ: ІНТЕРАКТИВНА КАРТА СТАНУ АВТО ===
    generatePartsStatusMap(car) {
        const carParts = [
            // Верхній ряд (шахматний порядок)
            { 
                name: 'Електрика', 
                emoji: '⚡', 
                parts: ['Стартер 🔋', 'Генератор ⚡', 'Акумулятор 🔋', 'Компютерна діагностика 💻', "Комп'ютерна діагностика 💻"], 
                x: 25, 
                y: 30 
            },
            { 
                name: 'Двигун', 
                emoji: '🔧', 
                parts: [
                    'ТО (масло+фільтри) 🛢️', 
                    'ГРМ (ролики+ремінь) ⚙️', 
                    'Помпа 💧', 
                    'Обвідний ремінь+ролики 🔧',
                    'Прожиг сажового фільтру 🔥',
                    'Свічки запалювання 🔥'
                ], 
                x: 50, 
                y: 30 
            },
            { 
                name: 'Ходова частина', 
                emoji: '🔩', 
                parts: [
                    'Амортизатори передні🔧', 
                    'Амортизатори задні🔧', 
                    'Опора амортизаторів 🛠️', 
                    'Шарова опора ⚪', 
                    'Рульова тяга 🔗', 
                    'Рульовий накінечник 🔩',
                    'Діагностика ходової 🔍',
                    'Розвал-сходження 📐'
                ], 
                x: 75, 
                y: 30 
            },
            // Нижній ряд (шахматний порядок - зміщений)
            { 
                name: 'Гальмівна система', 
                emoji: '🛑', 
                parts: [
                    'Гальмівні колодки передні🛑', 
                    'Гальмівні колодки задні🛑', 
                    'Гальмівні диски передні💿', 
                    'Гальмівні диски задні💿',
                    'Гальмівні колодки ручного гальма🛑',
                    'Профілактика направляючих супортів 🛠️'
                ], 
                x: 37.5, 
                y: 80 
            },
            { 
                name: 'Трансмісія', 
                emoji: '⚙️', 
                parts: ['Зчеплення ⚙️'], 
                x: 62.5, 
                y: 80 
            }
        ];
        
        return `
            <div class="mt-6 mb-4 bg-white rounded-xl shadow-xl p-3 sm:p-4 border border-gray-200">
                <h4 class="font-semibold text-gray-800 mb-3 text-center text-lg">🗺️ Інтерактивна карта стану авто</h4>
                <div class="relative bg-gray-100 rounded-lg p-4 h-80">
                    ${carParts.map(system => {
                        const systemStatus = this.getSystemStatus(car, system.parts, system.name);
                        const statusColor = systemStatus === 'good' ? 'bg-green-500' : 
                                           systemStatus === 'warning' ? 'bg-orange-500' : 'bg-red-500';
                        const statusIcon = systemStatus === 'good' ? '✅' : 
                                          systemStatus === 'warning' ? '⚠️' : '⛔';
                        
                        const statusText = systemStatus === 'good' ? 'Норма' : systemStatus === 'warning' ? 'Увага' : 'Критично';
                        
                        return `
                            <div class="absolute" style="left: ${system.x}%; top: ${system.y}%; transform: translate(-50%, -50%); z-index: 10;">
                                <div class="relative">
                                    <div class="w-20 h-20 ${statusColor} rounded-full flex flex-col items-center justify-center text-white font-bold shadow-lg"
                                         style="background: ${systemStatus === 'good' ? '#10b981' : systemStatus === 'warning' ? '#f97316' : '#ef4444'};">
                                        <div class="text-3xl">${system.emoji}</div>
                                        <div class="text-sm mt-0.5 font-bold">${statusIcon}</div>
                                    </div>
                                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-center w-full">
                                        <div class="text-xs font-bold text-gray-800 whitespace-nowrap">${statusText}</div>
                                    </div>
                                    <div class="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-2 z-20 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                        <div class="font-bold text-gray-800 text-sm mb-1 text-center">${system.name}</div>
                                        <div class="text-xs text-gray-700 border-t pt-1 mt-1">${this.getSystemDetails(car, system.parts)}</div>
                                    </div>
                                    <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 text-center pointer-events-none">
                                        <div class="bg-white px-3 py-1 rounded shadow-lg text-xs font-bold text-gray-900 whitespace-nowrap border-2 border-gray-300">${system.name}</div>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="mt-3 flex justify-center gap-4 text-xs">
                    <div class="flex items-center gap-1.5">
                        <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                        <span class="text-gray-700 font-semibold">Норма</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <div class="w-4 h-4 bg-orange-500 rounded-full"></div>
                        <span class="text-gray-700 font-semibold">Увага</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <div class="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span class="text-gray-700 font-semibold">Критично</span>
                    </div>
                </div>
            </div>
        `;
    }

    getSystemStatus(car, partNames, systemName) {
        let criticalCount = 0;
        let hasWarning = false;
        
        // Запчастини, для яких не застосовується умова про кількість критичних
        const excludedParts = [
            'ТО (масло+фільтри) 🛢️',
            'ГРМ (ролики+ремінь) ⚙️',
            'Помпа 💧',
            'Обвідний ремінь+ролики 🔧'
        ];
        
        for (const partName of partNames) {
            const part = car.parts[partName];
            if (part) {
                if (part.status === 'critical') {
                    // Для вузла "Двигун" і виключених запчастин використовуємо стару логіку
                    if (systemName === 'Двигун' && excludedParts.includes(partName)) {
                        // Для цих запчастин одразу повертаємо critical
                        return 'critical';
                    } else {
                        criticalCount++;
                    }
                }
                if (part.status === 'warning') {
                    hasWarning = true;
                }
            }
        }
        
        // Для вузла "Двигун" з виключеними запчастинами - якщо дійшли сюди, значить немає critical серед виключених
        // Використовуємо стару логіку для вузла "Двигун"
        if (systemName === 'Двигун') {
            if (hasWarning) return 'warning';
            return 'good';
        }
        
        // Для інших вузлів використовуємо нову логіку з підрахунком критичних
        // Якщо є більше двох блоків з червоним статусом - вузол червоний
        if (criticalCount > 2) return 'critical';
        // Якщо є менше двох блоків з червоним статусом (але є хоча б один) - вузол помаранчевий
        if (criticalCount > 0) return 'warning';
        // Якщо є блоки з помаранчевим статусом - вузол помаранчевий
        if (hasWarning) return 'warning';
        return 'good';
    }

    getSystemDetails(car, partNames) {
        const details = [];
        for (const partName of partNames) {
            const part = car.parts[partName];
            if (part) {
                details.push(`${partName.split(' ')[0]}: ${part.status === 'good' ? '✅' : part.status === 'warning' ? '⚠️' : '⛔'}`);
            }
        }
        return details.length > 0 ? details.slice(0, 3).join(', ') + (details.length > 3 ? '...' : '') : 'Немає даних';
    }

    // === НОВІ ФУНКЦІЇ: ПАНЕЛЬ ШВИДКИХ ДІЙ ===
    generateQuickActions(car) {
        return `
            <div class="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button onclick="window.print()" 
                        class="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg transition-all hover:shadow">
                    <span class="text-2xl mb-1">🖨️</span>
                    <span class="text-xs font-medium text-blue-700">Друк звіту</span>
                </button>
                
                <button onclick="app.shareReport('${car.license}')" 
                        class="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 rounded-lg transition-all hover:shadow">
                    <span class="text-2xl mb-1">📤</span>
                    <span class="text-xs font-medium text-green-700">Поділитись</span>
                </button>
                
                <button onclick="app.downloadReport('${car.license}')" 
                        class="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 hover:from-purple-100 hover:to-purple-200 rounded-lg transition-all hover:shadow">
                    <span class="text-2xl mb-1">💾</span>
                    <span class="text-xs font-medium text-purple-700">Експорт PDF</span>
                </button>
                
                <button onclick="app.setReminder('${car.license}')" 
                        class="flex flex-col items-center justify-center p-3 bg-gradient-to-r from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 rounded-lg transition-all hover:shadow">
                    <span class="text-2xl mb-1">⏰</span>
                    <span class="text-xs font-medium text-orange-700">Нагадування</span>
                </button>
            </div>
        `;
    }

    // === НОВІ ФУНКЦІЇ: ПОШУК ЗАПЧАСТИН ===
    generatePartsSearch(car) {
        return `
            <div class="mt-4 mb-4 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
                <h4 class="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span>🔍</span> Пошук запчастин для ${car.model}
                </h4>
                
                <div class="flex gap-2 mb-2">
                    <input type="text" 
                           placeholder="Назва запчастини..." 
                           class="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                           id="partsSearchInput">
                    <button onclick="app.searchParts()"
                            class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors">
                        Знайти
                    </button>
                </div>
                
                <div class="text-xs text-gray-500">
                    Популярні запити: 
                    <span class="text-blue-600 cursor-pointer hover:underline" onclick="document.getElementById('partsSearchInput').value = 'фільтр масляний'">фільтр</span>, 
                    <span class="text-blue-600 cursor-pointer hover:underline" onclick="document.getElementById('partsSearchInput').value = 'колодки гальмівні'">колодки</span>, 
                    <span class="text-blue-600 cursor-pointer hover:underline" onclick="document.getElementById('partsSearchInput').value = 'амортизатор'">амортизатор</span>
                </div>
            </div>
        `;
    }

    generateCarHistoryHTML(car, displayHistory) {
        return `
            <h3 class="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span>📜</span> Історія обслуговування
                ${this.state.selectedHistoryPartFilter || this.state.historySearchTerm ? `
                    <div class="flex flex-wrap items-center gap-1">
                        ${this.state.selectedHistoryPartFilter ? `
                            <span class="text-xs font-normal text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                📌 ${this.state.selectedHistoryPartFilter}
                            </span>
                        ` : ''}
                        ${this.state.historySearchTerm ? `
                            <span class="text-xs font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
                                🔎 "${this.state.historySearchTerm}"
                            </span>
                        ` : ''}
                        <button onclick="app.setState({ selectedHistoryPartFilter: null, historySearchTerm: '' });"
                                class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1">
                            ✕ Скинути всі фільтри
                        </button>
                    </div>
                ` : ''}
                <span class="ml-auto text-xs font-normal text-gray-600">
                    ${displayHistory.length} з ${car.history.length} записів
                </span>
            </h3>

            <div class="mb-3">
                <label class="block text-xs font-medium text-gray-700 mb-1">🔍 Пошук в історії</label>
                <div class="flex gap-1">
                    <input
                        type="text"
                        value="${this.state.historySearchTerm}"
                        oninput="app.handleHistorySearchInput(event)"
                        placeholder="Пошук за текстом, датою або пробігом..."
                        class="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                        id="historySearchInput"
                        autocomplete="off"
                        autocorrect="off"
                        spellcheck="false"
                    >
                    ${this.state.historySearchTerm ? `
                        <button onclick="app.setState({ historySearchTerm: '' });"
                                class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded text-xs font-semibold transition-colors">
                            ✕
                        </button>
                    ` : ''}
                </div>
                <div class="text-xs text-gray-400 mt-1">Пошук працює по опису, даті, пробігу, коду запчастини та статусу</div>
            </div>

            ${displayHistory.length === 0 ? this.generateNoHistoryHTML() : this.generateHistoryListHTML(displayHistory)}
        `;
    }

    generateNoHistoryHTML() {
        const hasFilters = this.state.selectedHistoryPartFilter || this.state.historySearchTerm;

        return `
            <div class="text-center py-8 text-gray-500">
                <div class="text-3xl mb-2">🔍</div>
                <div class="text-base font-semibold">Записів не знайдено</div>
                <div class="text-xs text-gray-400 mt-1">
                    ${hasFilters ? 'Спробуйте змінити параметри пошуку або очистити фільтри' : 'Цей автомобіль ще не має записів в історії'}
                </div>
                ${hasFilters ? `
                    <button onclick="app.setState({ selectedHistoryPartFilter: null, historySearchTerm: '' });"
                            class="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition-colors text-xs">
                        Очистити всі фільтри
                    </button>
                ` : ''}
            </div>
        `;
    }

    generateHistoryListHTML(history) {
        return `
            <div class="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                ${history.map(record => this.generateHistoryRecordHTML(record)).join('')}
            </div>
        `;
    }

    generateHistoryRecordHTML(record) {
        const formattedDate = this.formatDate(record.date);
        const formattedMileage = this.formatMileage(record.mileage);
        const formattedQuantity = record.quantity && record.quantity > 0 ? this.formatNumber(record.quantity) : '';
        const formattedPrice = record.price && record.price > 0 ? this.formatPrice(record.price) + ' ₴' : '';
        const formattedTotal = record.totalWithVAT && record.totalWithVAT > 0 ? this.formatPrice(record.totalWithVAT) + ' ₴' : '';

        let description = record.description;

        let statusClass = 'bg-gray-100 text-gray-600';
        let statusIcon = '🔄';
        if (record.status) {
            const statusLower = record.status.toLowerCase();
            if (statusLower.includes('виконано') || statusLower.includes('готово') || statusLower.includes('підтверджено')) {
                statusClass = 'bg-green-100 text-green-700';
                statusIcon = '✅';
            } else if (statusLower.includes('очікує') || statusLower.includes('в обробці') || statusLower.includes('замовлено')) {
                statusClass = 'bg-blue-100 text-blue-700';
                statusIcon = '⏳';
            } else if (statusLower.includes('відмов') || statusLower.includes('скасовано') || statusLower.includes('недоступно')) {
                statusClass = 'bg-red-100 text-red-700';
                statusIcon = '❌';
            }
        }

        const unitDisplay = record.unit ? record.unit : (record.quantity > 0 ? 'шт.' : '');

        return `
            <div class="bg-gray-50 hover:bg-gray-100 rounded-lg p-3 sm:p-4 border border-gray-200 transition-all hover:shadow-sm">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2">
                        <span class="text-base">📅</span>
                        <span class="font-bold text-gray-800 text-sm">${formattedDate}</span>
                    </div>
                    <div class="flex items-center gap-2 bg-orange-50 px-2 sm:px-3 py-1 rounded-full">
                        <span class="text-sm">🛣️</span>
                        <span class="font-bold text-orange-700 text-sm">${formattedMileage}</span>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div class="text-gray-700 text-sm flex-1">
                        ${description}
                        ${record.partCode || record.unit || record.quantity > 0 || record.price > 0 || record.totalWithVAT > 0 ? `
                            <div class="mt-2 flex flex-wrap gap-2 items-center">
                                ${record.partCode ? `
                                    <span class="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                                        <span>🔩</span>
                                        <span class="font-medium">Код: ${record.partCode}</span>
                                    </span>
                                ` : ''}
                                ${unitDisplay ? `
                                    <span class="inline-flex items-center gap-1 bg-gray-100 px-2 py-1 rounded text-xs">
                                        <span>📦</span>
                                        <span>Од.: ${unitDisplay}</span>
                                    </span>
                                ` : ''}
                                ${formattedQuantity ? `
                                    <span class="inline-flex items-center gap-1 bg-blue-50 px-2 py-1 rounded text-xs">
                                        <span>🔢</span>
                                        <span>Кільк.: ${formattedQuantity}</span>
                                    </span>
                                ` : ''}
                                ${formattedPrice ? `
                                    <span class="inline-flex items-center gap-1 bg-blue-100 px-2 py-1 rounded text-xs">
                                        <span>💰</span>
                                        <span class="font-semibold">Ціна: ${formattedPrice}</span>
                                    </span>
                                ` : ''}
                                ${formattedTotal ? `
                                    <span class="inline-flex items-center gap-1 bg-green-100 px-2 py-1 rounded text-xs">
                                        <span>💵</span>
                                        <span class="font-bold">Сума: ${formattedTotal}</span>
                                    </span>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>

                    ${record.status ? `
                        <div class="${statusClass} px-2 sm:px-3 py-1 rounded text-xs font-medium whitespace-nowrap mt-2 sm:mt-0 self-start">
                            ${statusIcon} ${record.status}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // === ДОПОМІЖНІ МЕТОДИ ===
    // Використовуємо модуль StatsCalculator
    getCities(cars) {
        return StatsCalculator.getCities(cars);
    }

    calculateStats(cars) {
        return StatsCalculator.calculateStats(
            cars,
            (car) => this.calculateHealthScore(car),
            (score) => this.getHealthScoreLabel(score)
        );
    }

    matchesKeywords(description, keywords) {
        const lowerDesc = description.toLowerCase();
        for (const keyword of keywords) {
            if (lowerDesc.includes(keyword.toLowerCase())) return true;
        }
        return false;
    }

    // === УПРАВЛІННЯ СТАНОМ ===
    setState(newState) {
        try {
        const oldState = { ...this.state };
        this.state = { ...this.state, ...newState };
        
        const needsRefilter = 
            oldState.searchTerm !== this.state.searchTerm ||
            oldState.selectedCity !== this.state.selectedCity ||
            oldState.selectedStatus !== this.state.selectedStatus ||
            oldState.selectedHealthStatus !== this.state.selectedHealthStatus ||
            oldState.selectedModel !== this.state.selectedModel ||
            JSON.stringify(oldState.selectedPartFilter) !== JSON.stringify(this.state.selectedPartFilter);
        
        if (needsRefilter) {
            this.filteredCars = null;
        }
        
        this.render();
        } catch (error) {
            console.error('Помилка в setState:', error, newState);
        }
    }

    clearPartFilter() {
        this.setState({ selectedPartFilter: null });
    }

    clearAllFilters() {
        this.setState({ 
            selectedPartFilter: null,
            selectedHealthStatus: null,
            selectedModel: null
        });
    }

    showPartFilterMenu(event, partName) {
        event.stopPropagation();

        const existingMenu = document.getElementById('partFilterMenu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'partFilterMenu';
        menu.className = 'fixed bg-white shadow-2xl rounded-lg border border-blue-400 p-3 z-50 min-w-[180px]';
        
        const rect = event.target.getBoundingClientRect();
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = (rect.left) + 'px';
        menu.style.position = 'fixed';

        menu.innerHTML = `
            <div class="text-sm font-bold text-gray-800 mb-2 pb-2 border-b">Фільтр: ${partName.split(' ')[0]}</div>
            <div class="space-y-1">
                <div class="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors text-sm flex items-center gap-2"
                     onclick="app.setState({ selectedPartFilter: { partName: '${partName}', status: 'all' } }); setTimeout(() => { document.getElementById('partFilterMenu')?.remove(); }, 100);">
                    📋 <span>Всі записи</span>
                </div>
                <div class="px-3 py-2 hover:bg-green-50 rounded cursor-pointer transition-colors text-sm flex items-center gap-2"
                     onclick="app.setState({ selectedPartFilter: { partName: '${partName}', status: 'good' } }); setTimeout(() => { document.getElementById('partFilterMenu')?.remove(); }, 100);">
                    ✅ <span>У нормі</span>
                </div>
                <div class="px-3 py-2 hover:bg-orange-50 rounded cursor-pointer transition-colors text-sm flex items-center gap-2"
                     onclick="app.setState({ selectedPartFilter: { partName: '${partName}', status: 'warning' } }); setTimeout(() => { document.getElementById('partFilterMenu')?.remove(); }, 100);">
                    ⚠️ <span>Увага</span>
                </div>
                <div class="px-3 py-2 hover:bg-red-50 rounded cursor-pointer transition-colors text-sm flex items-center gap-2"
                     onclick="app.setState({ selectedPartFilter: { partName: '${partName}', status: 'critical' } }); setTimeout(() => { document.getElementById('partFilterMenu')?.remove(); }, 100);">
                    ⛔ <span>Критично</span>
                </div>
            </div>
        `;

        document.body.appendChild(menu);

        setTimeout(() => {
            const closeMenu = (e) => {
                if (menu && !menu.contains(e.target) && e.target !== event.target) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 10);
    }

    showHealthStatusFilterMenu(event) {
        event.stopPropagation();

        const existingMenu = document.getElementById('healthStatusFilterMenu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.id = 'healthStatusFilterMenu';
        menu.className = 'fixed bg-white shadow-2xl rounded-lg border border-blue-400 p-3 z-50 min-w-[180px]';
        
        const rect = event.target.getBoundingClientRect();
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = (rect.left) + 'px';
        menu.style.position = 'fixed';

        const healthStatuses = [
            { value: null, label: 'Всі стани', icon: '📋' },
            { value: 'Відмінний', label: 'Відмінний', icon: '🟢' },
            { value: 'Добрий', label: 'Добрий', icon: '🔵' },
            { value: 'Задовільний', label: 'Задовільний', icon: '🟡' },
            { value: 'Поганий', label: 'Поганий', icon: '🟠' },
            { value: 'Критичний', label: 'Критичний', icon: '🔴' }
        ];

        menu.innerHTML = `
            <div class="text-sm font-bold text-gray-800 mb-2 pb-2 border-b">Фільтр: Стан авто</div>
            <div class="space-y-1">
                ${healthStatuses.map(status => `
                    <div class="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors text-sm flex items-center gap-2 ${this.state.selectedHealthStatus === status.value ? 'bg-blue-100' : ''}"
                         onclick="app.setState({ selectedHealthStatus: ${status.value === null ? 'null' : `'${status.value}'`} }); setTimeout(() => { document.getElementById('healthStatusFilterMenu')?.remove(); }, 100);">
                        ${status.icon} <span>${status.label}</span>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(menu);

        setTimeout(() => {
            const closeMenu = (e) => {
                if (menu && !menu.contains(e.target) && e.target !== event.target) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 10);
    }

    showModelFilterMenu(event) {
        event.stopPropagation();

        const existingMenu = document.getElementById('modelFilterMenu');
        if (existingMenu) existingMenu.remove();

        if (!this.processedCars) {
            this.processedCars = this.processCarData();
        }

        // Отримуємо список унікальних марок
        const models = new Set();
        for (const car of this.processedCars) {
            if (car.model) {
                const brand = car.model.split(' ')[0];
                if (brand) models.add(brand);
            }
        }
        const sortedModels = Array.from(models).sort((a, b) => a.localeCompare(b, 'uk'));

        const menu = document.createElement('div');
        menu.id = 'modelFilterMenu';
        menu.className = 'fixed bg-white shadow-2xl rounded-lg border border-blue-400 p-3 z-50 min-w-[180px] max-h-[400px] overflow-y-auto';
        
        const rect = event.target.getBoundingClientRect();
        menu.style.top = (rect.bottom + 5) + 'px';
        menu.style.left = (rect.left) + 'px';
        menu.style.position = 'fixed';

        menu.innerHTML = `
            <div class="text-sm font-bold text-gray-800 mb-2 pb-2 border-b">Фільтр: Марка</div>
            <div class="space-y-1">
                <div class="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors text-sm flex items-center gap-2 ${this.state.selectedModel === null ? 'bg-blue-100' : ''}"
                     onclick="app.setState({ selectedModel: null }); setTimeout(() => { document.getElementById('modelFilterMenu')?.remove(); }, 100);">
                    📋 <span>Всі марки</span>
                </div>
                ${sortedModels.map(model => `
                    <div class="px-3 py-2 hover:bg-blue-50 rounded cursor-pointer transition-colors text-sm flex items-center gap-2 ${this.state.selectedModel === model ? 'bg-blue-100' : ''}"
                         onclick="app.setState({ selectedModel: '${model}' }); setTimeout(() => { document.getElementById('modelFilterMenu')?.remove(); }, 100);">
                        🚗 <span>${model}</span>
                    </div>
                `).join('')}
            </div>
        `;

        document.body.appendChild(menu);

        setTimeout(() => {
            const closeMenu = (e) => {
                if (menu && !menu.contains(e.target) && e.target !== event.target) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 10);
    }

    // === НОВІ ФУНКЦІЇ: ДІЇ ===
    shareReport(license) {
        const car = this.processedCars.find(c => c.car === license);
        if (!car) return;
        
        const reportData = {
            license: car.license,
            model: car.model,
            year: car.year,
            city: car.city,
            currentMileage: this.formatMileage(car.currentMileage),
            healthScore: this.calculateHealthScore(car),
            criticalParts: Object.entries(car.parts)
                .filter(([_, part]) => part && part.status === 'critical')
                .map(([name, part]) => `${name.split(' ')[0]} (${this.formatMileageDiff(part.mileageDiff)})`)
        };
        
        const reportText = `Звіт по авто ${car.license}:
Модель: ${car.model}
Рік: ${car.year}
Місто: ${car.city}
Пробіг: ${this.formatMileage(car.currentMileage)}
Стан авто: ${this.calculateHealthScore(car)}%
Критичні деталі: ${reportData.criticalParts.join(', ') || 'немає'}
        
Звіт згенеровано ${new Date().toLocaleDateString('uk-UA')}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Звіт по авто ${car.license}`,
                text: reportText,
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(reportText).then(() => {
                this.showNotification('Звіт скопійовано в буфер обміну', 'success');
            });
        }
    }

    downloadReport(license) {
        this.showNotification('Експорт PDF у розробці', 'info');
    }

    setReminder(license) {
        const car = this.processedCars.find(c => c.car === license);
        if (!car) return;
        
        const forecast = this.generateMaintenanceForecast(car);
        if (forecast.length > 0) {
            const nextMaintenance = forecast[0];
            const reminderText = `Нагадування для ${car.license}: ${nextMaintenance.part.split(' ')[0]} - ${nextMaintenance.when}`;
            
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Нагадування про обслуговування', {
                    body: reminderText,
                    icon: 'icon-192.png'
                });
            } else if ('Notification' in window && Notification.permission !== 'denied') {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        new Notification('Нагадування про обслуговування', {
                            body: reminderText,
                            icon: 'icon-192.png'
                        });
                    }
                });
            }
            
            localStorage.setItem(`reminder_${license}`, JSON.stringify({
                car: car.license,
                maintenance: nextMaintenance,
                date: new Date().toISOString()
            }));
            
            this.showNotification('Нагадування встановлено', 'success');
        } else {
            this.showNotification('Немає запланованих обслуговувань', 'info');
        }
    }

    searchParts() {
        this.showNotification('Пошук запчастин у розробці', 'info');
    }

    // === ОНОВЛЕННЯ ТА ПОВІДОМЛЕННЯ ===
    async refreshData(force = false) {
        console.log('🔄 Оновлення даних...');

        this.showNotification('Оновлення даних...', 'info');

        try {
            if (force) {
                localStorage.removeItem('carAnalyticsData');
                this.processedCars = null;
                this.filteredCars = null;
            }

            await this.fetchDataFromSheets();
            this.render();

            this.showNotification('Дані успішно оновлено', 'success');

        } catch (error) {
            console.error('❌ Помилка оновлення:', error);
            this.showNotification('Помилка оновлення даних: ' + error.message, 'error');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('modals-container');
        const id = 'notification-' + Date.now();

        const colors = {
            info: 'bg-blue-500',
            success: 'bg-green-500',
            warning: 'bg-orange-500',
            error: 'bg-red-500'
        };

        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-4 py-3 rounded-lg shadow-xl z-50 transform transition-transform duration-300 translate-x-full`;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-lg">${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                <span>${message}</span>
                <button onclick="document.getElementById('${id}').remove()" class="ml-4 text-white/80 hover:text-white">✕</button>
            </div>
        `;

        container.appendChild(notification);

        setTimeout(() => {
            notification.classList.remove('translate-x-full');
            notification.classList.add('translate-x-0');
        }, 10);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('translate-x-0');
                notification.classList.add('translate-x-full');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 5000);
    }

    showError(message) {
        const container = document.getElementById('app');
        container.innerHTML = `
            <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                <div class="bg-red-500/10 border border-red-500/30 rounded-xl p-6 max-w-md backdrop-blur-sm">
                    <div class="text-center">
                        <div class="text-4xl text-red-400 mb-3">❌</div>
                        <h2 class="text-xl font-bold text-white mb-2">Помилка завантаження</h2>
                        <div class="text-red-200 text-sm mb-4">${message.substring(0, 200)}</div>
                        <div class="text-left text-xs text-blue-200 mb-4">
                            <p class="font-semibold">Можливі причини:</p>
                            <ul class="mt-1 space-y-1">
                                <li>• Неправильний API ключ</li>
                                <li>• Немає доступу до таблиці</li>
                                <li>• Проблеми з інтернетом</li>
                                <li>• Неправильні назви аркушів</li>
                            </ul>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="location.reload()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                Оновити сторінку
                            </button>
                            <button onclick="app.refreshData(true)" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                Спробувати знову
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // === РЕЗЕРВНІ КАТЕГОРІЇ (якщо expense-categories.js не завантажений) ===
    getDefaultCategories() {
        return {
            'ТО та обслуговування': [],
            'Гальмівна система': [],
            'Ходова частина': [],
            'Двигун': [],
            'Електрика': [],
            'Трансмісія': [],
            'Кузов та салон': [],
            'Система вихлопу': [],
            'Витратні матеріали': [],
            'Мийка авто': [],
            'Інші витрати': []
        };
    }
}

// Ініціалізація
window.app = null;
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CarAnalyticsApp();
});