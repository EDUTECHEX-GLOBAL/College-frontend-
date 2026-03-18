// admindashboardlayout.js - Dashboard Layout Management

class AdminDashboardLayout {
    constructor() {
        this.init();
    }

    init() {
        this.setupSidebar();
        this.setupNavbar();
        this.setupResponsive();
        this.setupModal();
        this.setupNotifications();
        this.checkAuth();
        this.setupUniversitySection(); // New: Setup university section
        this.setupQuickActions(); // New: Setup quick actions
    }

    setupSidebar() {
        // Toggle sidebar
        const toggleBtn = document.querySelector('.toggle-sidebar');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('active');
                if (sidebar.classList.contains('active')) {
                    mainContent.style.marginLeft = 'var(--sidebar-width)';
                } else {
                    mainContent.style.marginLeft = '0';
                }
            });
        }

        // Handle sidebar menu clicks
        const menuItems = document.querySelectorAll('.sidebar-menu li');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Remove active class from all items
                menuItems.forEach(i => i.classList.remove('active'));
                // Add active class to clicked item
                item.classList.add('active');
                
                // Update page title
                const section = item.dataset.section;
                const pageTitle = document.querySelector('.page-title');
                
                if (pageTitle) {
                    const titles = {
                        'dashboard': 'Dashboard Overview',
                        'users': 'User Management',
                        'university': 'University Data Import', // New: University title
                        'settings': 'Settings',
                        'reports': 'Reports',
                        'profile': 'Profile',
                        'applications': 'Applications Management', // New: Applications title
                        'notifications': 'Notification Management' // New: Notifications title
                    };
                    pageTitle.textContent = titles[section] || 'Dashboard';
                }
                
                // Load section content
                this.loadSection(section);
            });
        });

        // Add active class to current section based on URL or state
        this.setActiveSection();
    }

    setActiveSection() {
        // Get current section from URL or localStorage
        const currentSection = localStorage.getItem('activeSection') || 'dashboard';
        const menuItems = document.querySelectorAll('.sidebar-menu li');
        
        menuItems.forEach(item => {
            if (item.dataset.section === currentSection) {
                item.classList.add('active');
            }
        });
    }

    setupNavbar() {
        // Setup search functionality
        const searchBar = document.querySelector('.search-bar');
        if (searchBar) {
            searchBar.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
            
            searchBar.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }

        // Setup admin profile dropdown
        const adminProfile = document.querySelector('.admin-profile');
        if (adminProfile) {
            adminProfile.addEventListener('click', () => {
                this.showProfileDropdown();
            });
        }

        // Setup notification bell
        const notificationBell = document.querySelector('.notification-bell');
        if (notificationBell) {
            notificationBell.addEventListener('click', () => {
                this.showNotifications();
            });
        }
    }

    setupResponsive() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.adjustLayout();
        });

        // Initial adjustment
        this.adjustLayout();
    }

    adjustLayout() {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const navbar = document.querySelector('.navbar');
        
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
            mainContent.style.marginLeft = '0';
        } else {
            sidebar.classList.add('active');
            mainContent.style.marginLeft = 'var(--sidebar-width)';
        }
    }

    setupModal() {
        // Close modal when clicking overlay
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.hideModal();
                }
            });
        }

        // Close modal button
        const closeModalBtn = document.querySelector('.close-modal');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // ESC key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    setupNotifications() {
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        // Fetch unread notification count
        this.fetchUnreadNotificationCount();
    }

    // New: Setup university section
    setupUniversitySection() {
        const universityImportBtn = document.querySelector('.university-import-btn');
        if (universityImportBtn) {
            universityImportBtn.addEventListener('click', () => {
                this.showUniversityImportModal();
            });
        }

        // Setup university data refresh
        const refreshUniversityBtn = document.querySelector('.refresh-university-data');
        if (refreshUniversityBtn) {
            refreshUniversityBtn.addEventListener('click', () => {
                this.refreshUniversityData();
            });
        }
    }

    // New: Setup quick actions
    setupQuickActions() {
        const quickActionCards = document.querySelectorAll('.quick-action-card');
        quickActionCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const action = card.dataset.action;
                if (action === 'import-university') {
                    // Trigger university import
                    const universityMenuItem = document.querySelector('[data-section="university"]');
                    if (universityMenuItem) {
                        universityMenuItem.click();
                    }
                }
            });
        });
    }

    checkAuth() {
        // Check if admin is logged in
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = 'admin-login.html';
            return;
        }

        // Verify token on server
        this.verifyAuth(token);
    }

    async verifyAuth(token) {
        try {
            const response = await fetch('/api/verify-admin', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }

            // Load admin profile
            await this.loadAdminProfile();
        } catch (error) {
            console.error('Auth error:', error);
            localStorage.removeItem('adminToken');
            window.location.href = 'admin-login.html';
        }
    }

    async loadAdminProfile() {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const adminData = await response.json();
                this.updateProfileUI(adminData);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    updateProfileUI(adminData) {
        const profileName = document.querySelector('.profile-info h4');
        const profileRole = document.querySelector('.profile-info p');
        const profileImg = document.querySelector('.profile-img');

        if (profileName) {
            profileName.textContent = adminData.name || 'Admin';
        }

        if (profileRole) {
            profileRole.textContent = adminData.role || 'Administrator';
        }

        if (profileImg && adminData.avatar) {
            profileImg.src = adminData.avatar;
            profileImg.alt = adminData.name;
        }
    }

    handleSearch(query) {
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        if (!query.trim()) return;

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const results = await response.json();
                this.displaySearchResults(results);
            }
        } catch (error) {
            console.error('Search error:', error);
        }
    }

    displaySearchResults(results) {
        // Implement search results display
        console.log('Search results:', results);
        
        // You can create a dropdown to show search results
        const searchContainer = document.querySelector('.search-container');
        if (searchContainer) {
            // Remove existing results dropdown
            const existingDropdown = document.querySelector('.search-results-dropdown');
            if (existingDropdown) {
                existingDropdown.remove();
            }

            // Create new results dropdown
            const resultsDropdown = document.createElement('div');
            resultsDropdown.className = 'search-results-dropdown';
            
            if (results.length === 0) {
                resultsDropdown.innerHTML = '<div class="no-results">No results found</div>';
            } else {
                resultsDropdown.innerHTML = results.map(result => `
                    <div class="search-result-item" data-type="${result.type}" data-id="${result.id}">
                        <span class="result-icon">${this.getResultIcon(result.type)}</span>
                        <div class="result-content">
                            <div class="result-title">${result.title}</div>
                            <div class="result-subtitle">${result.subtitle || ''}</div>
                        </div>
                    </div>
                `).join('');
            }

            // Position and show dropdown
            const searchBar = document.querySelector('.search-bar');
            const rect = searchBar.getBoundingClientRect();
            resultsDropdown.style.position = 'absolute';
            resultsDropdown.style.top = rect.bottom + 'px';
            resultsDropdown.style.left = rect.left + 'px';
            resultsDropdown.style.width = rect.width + 'px';
            resultsDropdown.style.zIndex = '1000';

            document.body.appendChild(resultsDropdown);

            // Handle result item clicks
            resultsDropdown.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('click', () => {
                    const type = item.dataset.type;
                    const id = item.dataset.id;
                    this.navigateToSearchResult(type, id);
                    resultsDropdown.remove();
                });
            });

            // Close dropdown when clicking outside
            setTimeout(() => {
                const closeDropdown = (e) => {
                    if (!resultsDropdown.contains(e.target) && !searchBar.contains(e.target)) {
                        resultsDropdown.remove();
                        document.removeEventListener('click', closeDropdown);
                    }
                };
                document.addEventListener('click', closeDropdown);
            }, 0);
        }
    }

    getResultIcon(type) {
        const icons = {
            'user': '👤',
            'university': '🏛️',
            'application': '📋',
            'college': '🏫',
            'course': '📚'
        };
        return icons[type] || '📄';
    }

    navigateToSearchResult(type, id) {
        // Navigate to the appropriate section
        switch(type) {
            case 'university':
                this.loadSection('university');
                break;
            case 'user':
                this.loadSection('users');
                break;
            case 'application':
                this.loadSection('applications');
                break;
            default:
                console.log('Navigate to:', type, id);
        }
    }

    loadSection(section) {
        // Save active section
        localStorage.setItem('activeSection', section);

        // Load section-specific content
        switch (section) {
            case 'dashboard':
                if (window.dashboard) {
                    window.dashboard.loadDashboardData();
                } else {
                    this.loadDefaultDashboard();
                }
                break;
            case 'users':
                if (window.userManagement) {
                    window.userManagement.loadUsers();
                } else {
                    this.loadUsersSection();
                }
                break;
            case 'university':
                this.loadUniversitySection(); // New: Load university section
                break;
            case 'applications':
                this.loadApplicationsSection(); // New: Load applications section
                break;
            case 'notifications':
                this.loadNotificationsSection(); // New: Load notifications section
                break;
            case 'settings':
                this.loadSettings();
                break;
            case 'reports':
                this.loadReports();
                break;
            case 'profile':
                this.loadProfile();
                break;
            default:
                this.loadDefaultDashboard();
        }
    }

    loadDefaultDashboard() {
        // Load default dashboard content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="dashboard-section">
                    <h2>Dashboard Overview</h2>
                    <p>Loading dashboard...</p>
                </div>
            `;
        }
    }

    loadUsersSection() {
        // Load users content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="users-section">
                    <div class="section-header">
                        <h2>User Management</h2>
                        <button class="btn btn-primary add-user-btn">
                            <i class="fas fa-plus"></i> Add New User
                        </button>
                    </div>
                    <div class="users-table-container">
                        <table class="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="users-table-body">
                                <tr>
                                    <td colspan="6" class="text-center">Loading users...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            
            // Load users data
            if (window.userManagement) {
                window.userManagement.loadUsers();
            }
        }
    }

    // New: Load university section
    loadUniversitySection() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="university-section">
                    <div class="section-header">
                        <h2>University Data Import</h2>
                        <div class="header-actions">
                            <button class="btn btn-secondary refresh-university-data">
                                <i class="fas fa-sync-alt"></i> Refresh Stats
                            </button>
                        </div>
                    </div>
                    
                    <div class="university-stats-grid">
                        <div class="stat-card">
                            <div class="stat-icon">🏛️</div>
                            <div class="stat-content">
                                <div class="stat-value" id="universities-count">0</div>
                                <div class="stat-label">Universities</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">🏫</div>
                            <div class="stat-content">
                                <div class="stat-value" id="colleges-count">0</div>
                                <div class="stat-label">Colleges</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">📚</div>
                            <div class="stat-content">
                                <div class="stat-value" id="total-records">0</div>
                                <div class="stat-label">Total Records</div>
                            </div>
                        </div>
                    </div>

                    <div class="last-updated-section">
                        <span class="last-updated-label">Last updated:</span>
                        <span class="last-updated-value" id="last-updated">Never</span>
                    </div>

                    <div class="info-box">
                        <h4>📋 What will be imported:</h4>
                        <ul>
                            <li>Complete university directory with names and codes</li>
                            <li>Affiliated colleges with their details</li>
                            <li>Location and contact information</li>
                            <li>Accreditation and ranking data</li>
                        </ul>
                    </div>

                    <div class="import-section">
                        <button class="btn btn-primary university-import-btn" id="university-import-btn">
                            <i class="fas fa-download"></i> Start Import Process
                        </button>
                    </div>

                    <div class="message-container" id="message-container"></div>

                    <div class="warning-note">
                        <span class="warning-icon">⚠️</span>
                        <span>
                            This operation may take a few minutes depending on your internet 
                            connection and the amount of data being imported.
                        </span>
                    </div>
                </div>
            `;

            // Setup university section event listeners
            this.setupUniversitySection();
            
            // Load university stats
            this.loadUniversityStats();
        }
    }

    // New: Load university stats
    async loadUniversityStats() {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/import-stats', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const stats = await response.json();
                
                const universitiesCount = document.getElementById('universities-count');
                const collegesCount = document.getElementById('colleges-count');
                const totalRecords = document.getElementById('total-records');
                const lastUpdated = document.getElementById('last-updated');

                if (universitiesCount) {
                    universitiesCount.textContent = stats.universities || 0;
                }
                if (collegesCount) {
                    collegesCount.textContent = stats.colleges || 0;
                }
                if (totalRecords) {
                    totalRecords.textContent = (stats.universities || 0) + (stats.colleges || 0);
                }
                if (lastUpdated) {
                    lastUpdated.textContent = stats.lastUpdated ? 
                        new Date(stats.lastUpdated).toLocaleString() : 'Never';
                }
            }
        } catch (error) {
            console.error('Failed to load university stats:', error);
        }
    }

    // New: Show university import modal
    showUniversityImportModal() {
        this.showModal(
            'Import University Data',
            `
                <div class="import-confirmation">
                    <p>Are you sure you want to import university and college data?</p>
                    <p class="warning-text">This may take a few minutes to complete.</p>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="dashboardLayout.hideModal()">Cancel</button>
                        <button class="btn btn-primary" id="confirm-import-btn">Confirm Import</button>
                    </div>
                </div>
            `
        );

        // Add event listener for confirm button
        setTimeout(() => {
            const confirmBtn = document.getElementById('confirm-import-btn');
            if (confirmBtn) {
                confirmBtn.addEventListener('click', () => {
                    this.hideModal();
                    this.importUniversityData();
                });
            }
        }, 100);
    }

    // New: Import university data
    async importUniversityData() {
        const importBtn = document.getElementById('university-import-btn');
        const messageContainer = document.getElementById('message-container');
        
        if (importBtn) {
            importBtn.disabled = true;
            importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importing...';
        }

        if (messageContainer) {
            messageContainer.innerHTML = '';
        }

        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/import-universities', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                this.showMessage('success', '✅ University & College data imported successfully!');
                
                // Refresh stats
                await this.loadUniversityStats();
                
                // Show success notification
                this.showNotification('success', 'University data imported successfully');
            } else {
                throw new Error('Import failed');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showMessage('error', '❌ Import failed. Please check backend connection.');
            this.showNotification('error', 'Failed to import university data');
        } finally {
            if (importBtn) {
                importBtn.disabled = false;
                importBtn.innerHTML = '<i class="fas fa-download"></i> Start Import Process';
            }
        }
    }

    // New: Show message
    showMessage(type, text) {
        const messageContainer = document.getElementById('message-container');
        if (messageContainer) {
            messageContainer.innerHTML = `
                <div class="message ${type}">
                    ${text}
                </div>
            `;
        }
    }

    // New: Refresh university data
    async refreshUniversityData() {
        const refreshBtn = document.querySelector('.refresh-university-data');
        if (refreshBtn) {
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        }

        await this.loadUniversityStats();

        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Stats';
        }

        this.showNotification('info', 'University stats refreshed');
    }

    // New: Load applications section
    loadApplicationsSection() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="applications-section">
                    <div class="section-header">
                        <h2>Applications Management</h2>
                        <div class="filter-actions">
                            <select class="filter-select" id="application-status-filter">
                                <option value="all">All Applications</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                            <button class="btn btn-primary export-btn">
                                <i class="fas fa-download"></i> Export
                            </button>
                        </div>
                    </div>
                    
                    <div class="applications-stats">
                        <div class="stat-badge">
                            <span class="stat-label">Total:</span>
                            <span class="stat-value" id="total-applications">0</span>
                        </div>
                        <div class="stat-badge pending">
                            <span class="stat-label">Pending:</span>
                            <span class="stat-value" id="pending-applications">0</span>
                        </div>
                        <div class="stat-badge approved">
                            <span class="stat-label">Approved:</span>
                            <span class="stat-value" id="approved-applications">0</span>
                        </div>
                        <div class="stat-badge rejected">
                            <span class="stat-label">Rejected:</span>
                            <span class="stat-value" id="rejected-applications">0</span>
                        </div>
                    </div>

                    <div class="applications-table-container">
                        <table class="applications-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Applicant</th>
                                    <th>Type</th>
                                    <th>Submitted</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody id="applications-table-body">
                                <tr>
                                    <td colspan="6" class="text-center">Loading applications...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            // Setup applications event listeners
            const filterSelect = document.getElementById('application-status-filter');
            if (filterSelect) {
                filterSelect.addEventListener('change', () => {
                    this.loadApplications(filterSelect.value);
                });
            }

            // Load applications data
            this.loadApplications();
        }
    }

    // New: Load applications
    async loadApplications(status = 'all') {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/admin/applications?status=${status}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayApplications(data);
            }
        } catch (error) {
            console.error('Failed to load applications:', error);
        }
    }

    // New: Display applications
    displayApplications(data) {
        const tbody = document.getElementById('applications-table-body');
        if (!tbody) return;

        // Update stats
        const totalEl = document.getElementById('total-applications');
        const pendingEl = document.getElementById('pending-applications');
        const approvedEl = document.getElementById('approved-applications');
        const rejectedEl = document.getElementById('rejected-applications');

        if (totalEl) totalEl.textContent = data.total || 0;
        if (pendingEl) pendingEl.textContent = data.pending || 0;
        if (approvedEl) approvedEl.textContent = data.approved || 0;
        if (rejectedEl) rejectedEl.textContent = data.rejected || 0;

        // Display applications
        if (!data.applications || data.applications.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">No applications found</td></tr>';
            return;
        }

        tbody.innerHTML = data.applications.map(app => `
            <tr>
                <td>${app.id}</td>
                <td>
                    <div class="applicant-info">
                        <span class="applicant-name">${app.name}</span>
                        <span class="applicant-email">${app.email}</span>
                    </div>
                </td>
                <td>${app.type}</td>
                <td>${new Date(app.submitted).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge ${app.status}">${app.status}</span>
                </td>
                <td>
                    <button class="action-btn view-btn" data-id="${app.id}">👁️</button>
                    <button class="action-btn edit-btn" data-id="${app.id}">✏️</button>
                </td>
            </tr>
        `).join('');
    }

    // New: Load notifications section
    loadNotificationsSection() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="notifications-section">
                    <div class="section-header">
                        <h2>Notification Management</h2>
                        <button class="btn btn-primary mark-all-read-btn">
                            <i class="fas fa-check-double"></i> Mark All as Read
                        </button>
                    </div>

                    <div class="notifications-filters">
                        <button class="filter-btn active" data-filter="all">All</button>
                        <button class="filter-btn" data-filter="unread">Unread</button>
                        <button class="filter-btn" data-filter="read">Read</button>
                    </div>

                    <div class="notifications-list" id="notifications-list">
                        <div class="loading-spinner">Loading notifications...</div>
                    </div>
                </div>
            `;

            // Setup notification filters
            const filterBtns = document.querySelectorAll('.filter-btn');
            filterBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    filterBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.loadNotifications(btn.dataset.filter);
                });
            });

            // Load notifications
            this.loadNotifications();
        }
    }

    // New: Load notifications
    async loadNotifications(filter = 'all') {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch(`/api/admin/notifications?filter=${filter}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const notifications = await response.json();
                this.displayNotifications(notifications);
                this.updateNotificationBadge(notifications.unreadCount);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        }
    }

    // New: Display notifications
    displayNotifications(notifications) {
        const list = document.getElementById('notifications-list');
        if (!list) return;

        if (!notifications || notifications.length === 0) {
            list.innerHTML = '<div class="empty-state">No notifications found</div>';
            return;
        }

        list.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-icon">${this.getNotificationIcon(notification.type)}</div>
                <div class="notification-content">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-time">${this.formatTime(notification.createdAt)}</div>
                </div>
                <div class="notification-actions">
                    <button class="mark-read-btn" onclick="dashboardLayout.markNotificationRead('${notification.id}')">
                        ${notification.read ? '✓' : '○'}
                    </button>
                </div>
            </div>
        `).join('');
    }

    getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️',
            'university': '🏛️',
            'user': '👤'
        };
        return icons[type] || '📋';
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        return date.toLocaleDateString();
    }

    async markNotificationRead(id) {
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(`/api/admin/notifications/${id}/read`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Refresh notifications
            const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
            this.loadNotifications(activeFilter);
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    }

    async fetchUnreadNotificationCount() {
        try {
            const token = localStorage.getItem('adminToken');
            const response = await fetch('/api/admin/notifications/unread-count', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.updateNotificationBadge(data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    }

    updateNotificationBadge(count) {
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }

        // Update sidebar notification badge if exists
        const sidebarBadge = document.querySelector('.notification-badge-sidebar');
        if (sidebarBadge) {
            if (count > 0) {
                sidebarBadge.textContent = count > 99 ? '99+' : count;
                sidebarBadge.style.display = 'flex';
            } else {
                sidebarBadge.style.display = 'none';
            }
        }
    }

    loadSettings() {
        // Load settings content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="settings-section">
                    <h2>Settings</h2>
                    
                    <div class="settings-tabs">
                        <button class="tab-btn active" data-tab="general">General</button>
                        <button class="tab-btn" data-tab="notifications">Notifications</button>
                        <button class="tab-btn" data-tab="security">Security</button>
                        <button class="tab-btn" data-tab="api">API</button>
                    </div>

                    <div class="settings-content" id="settings-content">
                        <div class="settings-card">
                            <h3>General Settings</h3>
                            <div class="settings-item">
                                <label>Site Name</label>
                                <input type="text" value="Admin Dashboard" class="settings-input" />
                            </div>
                            <div class="settings-item">
                                <label>Timezone</label>
                                <select class="settings-select">
                                    <option value="UTC">UTC</option>
                                    <option value="IST">IST</option>
                                    <option value="EST">EST</option>
                                </select>
                            </div>
                            <div class="settings-item">
                                <label>Date Format</label>
                                <select class="settings-select">
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </select>
                            </div>
                        </div>

                        <div class="settings-card">
                            <h3>Notification Settings</h3>
                            <div class="settings-item">
                                <label class="checkbox-label">
                                    <input type="checkbox" checked />
                                    Email Notifications
                                </label>
                            </div>
                            <div class="settings-item">
                                <label class="checkbox-label">
                                    <input type="checkbox" checked />
                                    User Registration Alerts
                                </label>
                            </div>
                            <div class="settings-item">
                                <label class="checkbox-label">
                                    <input type="checkbox" />
                                    Import Completion Notifications
                                </label>
                            </div>
                        </div>

                        <div class="settings-actions">
                            <button class="btn btn-primary">Save Settings</button>
                            <button class="btn btn-secondary">Reset to Default</button>
                        </div>
                    </div>
                </div>
            `;

            // Setup settings tabs
            const tabBtns = document.querySelectorAll('.tab-btn');
            tabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    tabBtns.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.loadSettingsTab(btn.dataset.tab);
                });
            });
        }
    }

    loadSettingsTab(tab) {
        const content = document.getElementById('settings-content');
        if (!content) return;

        // Load different settings based on tab
        switch(tab) {
            case 'general':
                // Already showing general
                break;
            case 'notifications':
                content.innerHTML = `
                    <div class="settings-card">
                        <h3>Notification Preferences</h3>
                        <!-- Notification settings content -->
                    </div>
                `;
                break;
            case 'security':
                content.innerHTML = `
                    <div class="settings-card">
                        <h3>Security Settings</h3>
                        <!-- Security settings content -->
                    </div>
                `;
                break;
            case 'api':
                content.innerHTML = `
                    <div class="settings-card">
                        <h3>API Configuration</h3>
                        <!-- API settings content -->
                    </div>
                `;
                break;
        }
    }

    loadReports() {
        // Load reports content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="reports-section">
                    <h2>Reports</h2>
                    <p>Reports content will be loaded here.</p>
                </div>
            `;
        }
    }

    loadProfile() {
        // Load profile content
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="profile-section">
                    <h2>Profile</h2>
                    <p>Profile content will be loaded here.</p>
                </div>
            `;
        }
    }

    showModal(title, content) {
        const modalOverlay = document.querySelector('.modal-overlay');
        const modalContent = document.querySelector('.modal-content');
        
        if (modalOverlay && modalContent) {
            // Update modal content
            const modalTitle = modalContent.querySelector('.modal-header h3');
            const modalBody = modalContent.querySelector('.modal-body');
            
            if (modalTitle) modalTitle.textContent = title;
            if (modalBody) modalBody.innerHTML = content;
            
            // Show modal
            modalOverlay.style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal() {
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showNotification(type, message) {
        const notification = document.createElement('div');
        notification.className = `notification-toast ${type}`;
        notification.innerHTML = `
            <div class="notification-icon">${this.getNotificationIcon(type)}</div>
            <div class="notification-message">${message}</div>
            <button class="notification-close">&times;</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);

        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    showProfileDropdown() {
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'profile-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-content">
                <a href="#" class="dropdown-item" data-section="profile">
                    <i class="fas fa-user"></i> My Profile
                </a>
                <a href="#" class="dropdown-item" data-section="settings">
                    <i class="fas fa-cog"></i> Settings
                </a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item logout-btn">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </a>
            </div>
        `;

        // Position dropdown
        const profile = document.querySelector('.admin-profile');
        const rect = profile.getBoundingClientRect();
        dropdown.style.position = 'absolute';
        dropdown.style.top = rect.bottom + 'px';
        dropdown.style.right = '30px';
        dropdown.style.zIndex = '1001';

        document.body.appendChild(dropdown);

        // Handle navigation items
        dropdown.querySelectorAll('.dropdown-item[data-section]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.loadSection(section);
                
                // Update active menu item
                const menuItems = document.querySelectorAll('.sidebar-menu li');
                menuItems.forEach(menuItem => {
                    if (menuItem.dataset.section === section) {
                        menuItem.classList.add('active');
                    } else {
                        menuItem.classList.remove('active');
                    }
                });
                
                dropdown.remove();
            });
        });

        // Handle logout
        const logoutBtn = dropdown.querySelector('.logout-btn');
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });

        // Close dropdown when clicking outside
        const closeDropdown = (e) => {
            if (!dropdown.contains(e.target) && !profile.contains(e.target)) {
                dropdown.remove();
                document.removeEventListener('click', closeDropdown);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeDropdown);
        }, 0);
    }

    logout() {
        // Clear all auth data
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminEmail');
        localStorage.removeItem('adminName');
        localStorage.removeItem('activeSection');
        
        // Redirect to login
        window.location.href = 'admin-login.html';
    }

    showNotifications() {
        // Show notifications dropdown
        this.loadNotificationsSection();
        const notificationMenuItem = document.querySelector('[data-section="notifications"]');
        if (notificationMenuItem) {
            notificationMenuItem.click();
        }
    }
}

// Initialize layout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardLayout = new AdminDashboardLayout();
});