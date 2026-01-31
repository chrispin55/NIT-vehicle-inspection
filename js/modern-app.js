// PROJECT KALI - ITVMS Modern JavaScript Application
// NIT University Dar es Salaam
// Enhanced with API Integration and Comprehensive Error Handling

class ModernITVMS {
    constructor() {
        this.apiBase = window.location.origin + '/api';
        this.token = null;
        this.user = null;
        this.data = {
            vehicles: [],
            drivers: [],
            trips: [],
            maintenance: [],
            fuelRecords: [],
            stats: {}
        };
        
        // Initialize the application
        this.init();
    }

    // Initialize application
    async init() {
        try {
            console.log('🚀 Initializing PROJECT KALI ITVMS...');
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup form validation
            this.setupFormValidation();
            
            // Skip authentication and go directly to dashboard
            console.log('📋 Skipping authentication - Direct access mode');
            this.showDashboard();
            await this.loadDashboardData();
            
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    // Setup event listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        // Tab navigation
        const tabButtons = document.querySelectorAll('[data-bs-toggle="pill"]');
        tabButtons.forEach(button => {
            button.addEventListener('shown.bs.tab', (e) => this.handleTabChange(e));
        });

        // Vehicle form
        const vehicleForm = document.getElementById('vehicleForm');
        if (vehicleForm) {
            vehicleForm.addEventListener('submit', (e) => this.handleVehicleSubmit(e));
        }

        // Driver form
        const driverForm = document.getElementById('driverForm');
        if (driverForm) {
            driverForm.addEventListener('submit', (e) => this.handleDriverSubmit(e));
        }

        // Trip form
        const tripForm = document.getElementById('tripForm');
        if (tripForm) {
            tripForm.addEventListener('submit', (e) => this.handleTripSubmit(e));
        }

        // Maintenance form
        const maintenanceForm = document.getElementById('maintenanceForm');
        if (maintenanceForm) {
            maintenanceForm.addEventListener('submit', (e) => this.handleMaintenanceSubmit(e));
        }

        // Search and filter inputs
        this.setupSearchFilters();
    }

    // Setup form validation
    setupFormValidation() {
        // Add real-time validation
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearFieldError(input));
            });
        });
    }

    // Validate individual field
    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (field.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }

        // Phone number validation
        if (field.id.includes('phone') && value && !this.isValidPhone(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number';
        }

        // Number validation
        if (field.type === 'number' && value && isNaN(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid number';
        }

        this.showFieldError(field, isValid, errorMessage);
        return isValid;
    }

    // Clear field error
    clearFieldError(field) {
        field.classList.remove('is-invalid');
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.remove();
        }
    }

    // Show field error
    showFieldError(field, isValid, message) {
        if (!isValid) {
            field.classList.add('is-invalid');
            
            let feedback = field.parentNode.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                field.parentNode.appendChild(feedback);
            }
            feedback.textContent = message;
        } else {
            this.clearFieldError(field);
        }
    }

    // Setup search and filters
    setupSearchFilters() {
        // Vehicle search
        const vehicleSearch = document.getElementById('vehicleSearch');
        if (vehicleSearch) {
            vehicleSearch.addEventListener('input', (e) => {
                this.filterVehicles(e.target.value);
            });
        }

        // Driver search
        const driverSearch = document.getElementById('driverSearch');
        if (driverSearch) {
            driverSearch.addEventListener('input', (e) => {
                this.filterDrivers(e.target.value);
            });
        }

        // Status filters
        const statusFilters = document.querySelectorAll('.status-filter');
        statusFilters.forEach(filter => {
            filter.addEventListener('change', () => {
                this.applyFilters();
            });
        });
    }

    // API request helper with error handling (no authentication required)
    async apiRequest(endpoint, options = {}) {
        const url = `${this.apiBase}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log(`✅ API Response: ${options.method || 'GET'} ${url} - Success`);
            return data;

        } catch (error) {
            console.error(`❌ API Error: ${options.method || 'GET'} ${url}:`, error);
            
            // Handle different error types
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Network error. Please check your internet connection.');
            } else if (error.message.includes('404')) {
                throw new Error('The requested resource was not found.');
            } else if (error.message.includes('500')) {
                throw new Error('Server error occurred. Please try again later.');
            } else {
                throw error;
            }
        }
    }

    // Authentication methods
    async checkAuthStatus() {
        try {
            // Check if user is authenticated by calling validate endpoint
            const response = await this.apiRequest('/auth/validate');
            this.user = response.user;
            this.token = response.token;
            
            // User is authenticated, load dashboard
            this.showDashboard();
            await this.loadDashboardData();
            
        } catch (error) {
            // User is not authenticated, show login screen
            console.log('User not authenticated, showing login screen');
            this.showLoginScreen();
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const submitBtn = e.target.querySelector('button[type="submit"]');
        
        try {
            // Show loading state
            this.setButtonLoading(submitBtn, true);
            
            const response = await this.apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            // Store token and user data in memory only
            this.token = response.token;
            this.user = response.user;

            // Show success message
            this.showSuccess('Login successful! Redirecting...');

            // Redirect to dashboard
            setTimeout(() => {
                this.showDashboard();
                this.loadDashboardData();
            }, 1500);

        } catch (error) {
            this.showError('Invalid username or password');
        } finally {
            this.setButtonLoading(submitBtn, false);
        }
    }

    async validateToken() {
        try {
            const response = await this.apiRequest('/auth/validate');
            this.user = response.user;
            return true;
        } catch (error) {
            console.error('Token validation failed:', error);
            this.handleTokenExpired();
            return false;
        }
    }

    handleTokenExpired() {
        this.token = null;
        this.user = null;
        this.showLoginScreen();
        this.showError('Your session has expired. Please login again.');
    }

    handleLogout() {
        try {
            // Call logout API
            this.apiRequest('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Clear memory
            this.token = null;
            this.user = null;
            
            this.showSuccess('Logged out successfully');
            this.showLoginScreen();
        }
    }

    // UI Navigation methods
    showLoginScreen() {
        document.getElementById('loginScreen').classList.remove('hidden');
        document.getElementById('appContainer').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('appContainer').classList.remove('hidden');
        
        // Update user info
        if (this.user) {
            const currentUser = document.getElementById('currentUser');
            if (currentUser) {
                currentUser.textContent = this.user.full_name || this.user.username;
            }
        }
    }

    handleTabChange(e) {
        const targetTab = e.target.getAttribute('data-bs-target');
        
        // Load data for the active tab
        switch (targetTab) {
            case '#dashboard':
                this.loadDashboardData();
                break;
            case '#vehicles':
                this.loadVehicles();
                break;
            case '#drivers':
                this.loadDrivers();
                break;
            case '#trips':
                this.loadTrips();
                break;
            case '#maintenance':
                this.loadMaintenance();
                break;
        }
    }

    // Data loading methods - Always fetch fresh data from database
    async loadDashboardData() {
        try {
            this.showLoading('dashboard');
            
            // Load fresh statistics from database
            const stats = await this.apiRequest('/vehicles/stats');
            this.updateDashboardStats(stats);
            
            // Load fresh recent trips from database
            const trips = await this.apiRequest('/trips?limit=5');
            this.renderRecentTrips(trips);
            
            this.hideLoading('dashboard');
            
        } catch (error) {
            this.hideLoading('dashboard');
            console.error('Failed to load dashboard data from database:', error);
            this.showError('Failed to load dashboard data. Please refresh the page.');
        }
    }

    async loadVehicles() {
        try {
            this.showLoading('vehicles');
            
            // Load fresh vehicles from database
            const vehicles = await this.apiRequest('/vehicles');
            this.data.vehicles = vehicles;
            this.renderVehicles(vehicles);
            
            this.hideLoading('vehicles');
            
        } catch (error) {
            this.hideLoading('vehicles');
            console.error('Failed to load vehicles from database:', error);
            this.showError('Failed to load vehicles. Please refresh the page.');
        }
    }

    async loadDrivers() {
        try {
            this.showLoading('drivers');
            
            // Load fresh drivers from database
            const drivers = await this.apiRequest('/drivers');
            this.data.drivers = drivers;
            this.renderDrivers(drivers);
            
            this.hideLoading('drivers');
            
        } catch (error) {
            this.hideLoading('drivers');
            console.error('Failed to load drivers from database:', error);
            this.showError('Failed to load drivers. Please refresh the page.');
        }
    }

    async loadTrips() {
        try {
            this.showLoading('trips');
            
            // Load fresh trips from database
            const trips = await this.apiRequest('/trips');
            this.data.trips = trips;
            this.renderTrips(trips);
            
            this.hideLoading('trips');
            
        } catch (error) {
            this.hideLoading('trips');
            console.error('Failed to load trips from database:', error);
            this.showError('Failed to load trips. Please refresh the page.');
        }
    }

    async loadMaintenance() {
        try {
            this.showLoading('maintenance');
            
            // Load fresh maintenance records from database
            const maintenance = await this.apiRequest('/maintenance');
            this.data.maintenance = maintenance;
            this.renderMaintenance(maintenance);
            
            this.hideLoading('maintenance');
            
        } catch (error) {
            this.hideLoading('maintenance');
            console.error('Failed to load maintenance records from database:', error);
            this.showError('Failed to load maintenance records. Please refresh the page.');
        }
    }

    // Form submission handlers
    async handleVehicleSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const vehicleData = Object.fromEntries(formData);
        
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, true);
            
            let response;
            if (vehicleData.id) {
                response = await this.apiRequest(`/vehicles/${vehicleData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(vehicleData)
                });
                this.showSuccess('Vehicle updated successfully');
            } else {
                response = await this.apiRequest('/vehicles', {
                    method: 'POST',
                    body: JSON.stringify(vehicleData)
                });
                this.showSuccess('Vehicle added successfully');
            }
            
            // Reset form and reload data
            e.target.reset();
            await this.loadVehicles();
            
        } catch (error) {
            console.error('Failed to save vehicle:', error);
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handleDriverSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const driverData = Object.fromEntries(formData);
        
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, true);
            
            let response;
            if (driverData.id) {
                response = await this.apiRequest(`/drivers/${driverData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(driverData)
                });
                this.showSuccess('Driver updated successfully');
            } else {
                response = await this.apiRequest('/drivers', {
                    method: 'POST',
                    body: JSON.stringify(driverData)
                });
                this.showSuccess('Driver added successfully');
            }
            
            // Reset form and reload data
            e.target.reset();
            await this.loadDrivers();
            
        } catch (error) {
            console.error('Failed to save driver:', error);
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handleTripSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const tripData = Object.fromEntries(formData);
        
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, true);
            
            let response;
            if (tripData.id) {
                response = await this.apiRequest(`/trips/${tripData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(tripData)
                });
                this.showSuccess('Trip updated successfully');
            } else {
                response = await this.apiRequest('/trips', {
                    method: 'POST',
                    body: JSON.stringify(tripData)
                });
                this.showSuccess('Trip added successfully');
            }
            
            // Reset form and reload data
            e.target.reset();
            await this.loadTrips();
            
        } catch (error) {
            console.error('Failed to save trip:', error);
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, false);
        }
    }

    async handleMaintenanceSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const maintenanceData = Object.fromEntries(formData);
        
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, true);
            
            let response;
            if (maintenanceData.id) {
                response = await this.apiRequest(`/maintenance/${maintenanceData.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(maintenanceData)
                });
                this.showSuccess('Maintenance record updated successfully');
            } else {
                response = await this.apiRequest('/maintenance', {
                    method: 'POST',
                    body: JSON.stringify(maintenanceData)
                });
                this.showSuccess('Maintenance record added successfully');
            }
            
            // Reset form and reload data
            e.target.reset();
            await this.loadMaintenance();
            
        } catch (error) {
            console.error('Failed to save maintenance record:', error);
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            this.setButtonLoading(submitBtn, false);
        }
    }

    // Rendering methods
    updateDashboardStats(stats) {
        // Update dashboard statistics
        const elements = {
            totalVehicles: document.getElementById('totalVehicles'),
            activeVehicles: document.getElementById('activeVehicles'),
            totalDrivers: document.getElementById('totalDrivers'),
            activeDrivers: document.getElementById('activeDrivers'),
            totalTrips: document.getElementById('totalTrips'),
            completedTrips: document.getElementById('completedTrips')
        };

        Object.entries(elements).forEach(([key, element]) => {
            if (element && stats[key] !== undefined) {
                element.textContent = stats[key];
            }
        });
    }

    renderVehicles(vehicles) {
        const container = document.getElementById('vehiclesList');
        if (!container) return;

        if (vehicles.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-car fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No vehicles found</h5>
                    <p class="text-muted">Add your first vehicle to get started</p>
                </div>
            `;
            return;
        }

        const html = vehicles.map(vehicle => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card dashboard-card vehicle-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h6 class="card-title mb-0">${vehicle.plate_number}</h6>
                            <span class="badge badge-status ${this.getStatusClass(vehicle.status)}">
                                ${vehicle.status}
                            </span>
                        </div>
                        <div class="vehicle-info">
                            <p class="mb-1"><strong>Type:</strong> ${vehicle.vehicle_type}</p>
                            <p class="mb-1"><strong>Model:</strong> ${vehicle.model}</p>
                            <p class="mb-1"><strong>Capacity:</strong> ${vehicle.capacity || 'N/A'}</p>
                            <p class="mb-0"><strong>Fuel:</strong> ${vehicle.fuel_type}</p>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-nit-outline me-2" onclick="app.editVehicle(${vehicle.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteVehicle(${vehicle.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderDrivers(drivers) {
        const container = document.getElementById('driversList');
        if (!container) return;

        if (drivers.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-user-tie fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No drivers found</h5>
                    <p class="text-muted">Add your first driver to get started</p>
                </div>
            `;
            return;
        }

        const html = drivers.map(driver => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card dashboard-card driver-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h6 class="card-title mb-0">${driver.full_name}</h6>
                            <span class="badge badge-status ${this.getStatusClass(driver.status)}">
                                ${driver.status}
                            </span>
                        </div>
                        <div class="driver-info">
                            <p class="mb-1"><strong>License:</strong> ${driver.license_number}</p>
                            <p class="mb-1"><strong>Phone:</strong> ${driver.phone_number || 'N/A'}</p>
                            <p class="mb-1"><strong>Experience:</strong> ${driver.experience_years || 0} years</p>
                            <p class="mb-0"><strong>Email:</strong> ${driver.email || 'N/A'}</p>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-nit-outline me-2" onclick="app.editDriver(${driver.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteDriver(${driver.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderTrips(trips) {
        const container = document.getElementById('tripsList');
        if (!container) return;

        if (trips.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-route fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No trips found</h5>
                    <p class="text-muted">Schedule your first trip to get started</p>
                </div>
            `;
            return;
        }

        const html = trips.map(trip => `
            <div class="col-12 mb-3">
                <div class="card dashboard-card trip-card">
                    <div class="card-body">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <div class="trip-route">
                                    <h6 class="mb-1">
                                        <i class="fas fa-map-marker-alt text-primary"></i>
                                        ${trip.route_from} → ${trip.route_to}
                                    </h6>
                                    <p class="mb-1">
                                        <strong>Date:</strong> ${new Date(trip.trip_date).toLocaleDateString()}
                                        ${trip.departure_time ? `<strong> Departure:</strong> ${trip.departure_time}` : ''}
                                    </p>
                                    <p class="mb-1">
                                        <strong>Driver:</strong> ${trip.driver_name || `ID: ${trip.driver_id}`}
                                        <strong> Vehicle:</strong> ${trip.vehicle_plate_number || `ID: ${trip.vehicle_id}`}
                                    </p>
                                </div>
                            </div>
                            <div class="col-md-4 text-end">
                                <span class="badge badge-status ${this.getStatusClass(trip.status)}">
                                    ${trip.status}
                                </span>
                                <div class="mt-2">
                                    <button class="btn btn-sm btn-nit-outline me-2" onclick="app.editTrip(${trip.id})">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="app.deleteTrip(${trip.id})">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderMaintenance(maintenance) {
        const container = document.getElementById('maintenanceList');
        if (!container) return;

        if (maintenance.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="fas fa-wrench fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No maintenance records found</h5>
                    <p class="text-muted">Add your first maintenance record to get started</p>
                </div>
            `;
            return;
        }

        const html = maintenance.map(record => `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card dashboard-card maintenance-card">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <h6 class="card-title mb-0">${record.service_type}</h6>
                            <small class="text-muted">${new Date(record.service_date).toLocaleDateString()}</small>
                        </div>
                        <div class="maintenance-info">
                            <p class="mb-1"><strong>Vehicle:</strong> ${record.vehicle_plate_number || `ID: ${record.vehicle_id}`}</p>
                            <p class="mb-1"><strong>Cost:</strong> ${record.cost ? `TZS ${record.cost.toLocaleString()}` : 'N/A'}</p>
                            <p class="mb-0"><strong>Performed by:</strong> ${record.performed_by || 'N/A'}</p>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-sm btn-nit-outline me-2" onclick="app.editMaintenance(${record.id})">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn btn-sm btn-outline-danger" onclick="app.deleteMaintenance(${record.id})">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = html;
    }

    renderRecentTrips(trips) {
        const container = document.getElementById('recentTrips');
        if (!container) return;

        if (trips.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent trips</p>';
            return;
        }

        const html = trips.map(trip => `
            <tr>
                <td>${trip.route_from} → ${trip.route_to}</td>
                <td>${new Date(trip.trip_date).toLocaleDateString()}</td>
                <td><span class="badge badge-status ${this.getStatusClass(trip.status)}">${trip.status}</span></td>
            </tr>
        `).join('');

        container.innerHTML = html;
    }

    // Helper methods
    getStatusClass(status) {
        const statusClasses = {
            'Active': 'badge-active',
            'Under Maintenance': 'badge-maintenance',
            'Inactive': 'badge-inactive',
            'Scheduled': 'badge-trip',
            'In Progress': 'badge-trip',
            'Completed': 'badge-active',
            'Cancelled': 'badge-inactive',
            'On Leave': 'badge-maintenance'
        };
        return statusClasses[status] || 'badge-secondary';
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    isValidPhone(phone) {
        const phoneRegex = /^[\d\s\-\+\(\)]+$/;
        return phoneRegex.test(phone);
    }

    setButtonLoading(button, loading) {
        if (loading) {
            button.disabled = true;
            button.innerHTML = '<span class="loading"></span> Loading...';
        } else {
            button.disabled = false;
            button.innerHTML = button.getAttribute('data-original-text') || 'Submit';
        }
    }

    showLoading(section) {
        const container = document.getElementById(`${section}List`);
        if (container) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <div class="loading mx-auto mb-3"></div>
                    <p class="text-muted">Loading...</p>
                </div>
            `;
        }
    }

    hideLoading(section) {
        // Loading will be replaced by actual content when data loads
    }

    // Notification methods (using the error handler)
    showError(message) {
        if (window.errorHandler) {
            window.errorHandler.handleError({
                type: 'Application Error',
                message: message
            });
        } else {
            alert('Error: ' + message);
        }
    }

    showSuccess(message) {
        if (window.errorHandler) {
            window.errorHandler.showSuccess(message);
        } else {
            alert('Success: ' + message);
        }
    }

    showInfo(message) {
        if (window.errorHandler) {
            window.errorHandler.showInfo(message);
        } else {
            alert('Info: ' + message);
        }
    }

    // CRUD operations (placeholders for now)
    async editVehicle(id) {
        this.showInfo(`Edit vehicle functionality for ID: ${id}`);
        // TODO: Implement edit vehicle modal/form
    }

    async deleteVehicle(id) {
        if (confirm('Are you sure you want to delete this vehicle?')) {
            try {
                await this.apiRequest(`/vehicles/${id}`, { method: 'DELETE' });
                this.showSuccess('Vehicle deleted successfully');
                await this.loadVehicles();
            } catch (error) {
                console.error('Failed to delete vehicle:', error);
            }
        }
    }

    async editDriver(id) {
        this.showInfo(`Edit driver functionality for ID: ${id}`);
        // TODO: Implement edit driver modal/form
    }

    async deleteDriver(id) {
        if (confirm('Are you sure you want to delete this driver?')) {
            try {
                await this.apiRequest(`/drivers/${id}`, { method: 'DELETE' });
                this.showSuccess('Driver deleted successfully');
                await this.loadDrivers();
            } catch (error) {
                console.error('Failed to delete driver:', error);
            }
        }
    }

    async editTrip(id) {
        this.showInfo(`Edit trip functionality for ID: ${id}`);
        // TODO: Implement edit trip modal/form
    }

    async deleteTrip(id) {
        if (confirm('Are you sure you want to delete this trip?')) {
            try {
                await this.apiRequest(`/trips/${id}`, { method: 'DELETE' });
                this.showSuccess('Trip deleted successfully');
                await this.loadTrips();
            } catch (error) {
                console.error('Failed to delete trip:', error);
            }
        }
    }

    async editMaintenance(id) {
        this.showInfo(`Edit maintenance functionality for ID: ${id}`);
        // TODO: Implement edit maintenance modal/form
    }

    async deleteMaintenance(id) {
        if (confirm('Are you sure you want to delete this maintenance record?')) {
            try {
                await this.apiRequest(`/maintenance/${id}`, { method: 'DELETE' });
                this.showSuccess('Maintenance record deleted successfully');
                await this.loadMaintenance();
            } catch (error) {
                console.error('Failed to delete maintenance record:', error);
            }
        }
    }

    // Filter methods
    filterVehicles(searchTerm) {
        const filtered = this.data.vehicles.filter(vehicle => 
            vehicle.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vehicle.vehicle_type.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderVehicles(filtered);
    }

    filterDrivers(searchTerm) {
        const filtered = this.data.drivers.filter(driver => 
            driver.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            driver.license_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (driver.phone_number && driver.phone_number.includes(searchTerm))
        );
        this.renderDrivers(filtered);
    }

    applyFilters() {
        // TODO: Implement advanced filtering
        console.log('Applying filters...');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ModernITVMS();
});

// Export for use in other scripts
window.ModernITVMS = ModernITVMS;
