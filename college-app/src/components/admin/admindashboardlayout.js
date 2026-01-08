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
                        'settings': 'Settings',
                        'reports': 'Reports',
                        'profile': 'Profile'
                    };
                    pageTitle.textContent = titles[section] || 'Dashboard';
                }
                
                // Load section content
                this.loadSection(section);
            });
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
    }

    loadSection(section) {
        // Load section-specific content
        switch (section) {
            case 'dashboard':
                window.dashboard.loadDashboardData();
                break;
            case 'users':
                window.dashboard.loadUsers();
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
        }
    }

    loadSettings() {
        // Load settings content
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="settings-section">
                <h2>Settings</h2>
                <p>Settings content will be loaded here.</p>
            </div>
        `;
    }

    loadReports() {
        // Load reports content
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="reports-section">
                <h2>Reports</h2>
                <p>Reports content will be loaded here.</p>
            </div>
        `;
    }

    loadProfile() {
        // Load profile content
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
            <div class="profile-section">
                <h2>Profile</h2>
                <p>Profile content will be loaded here.</p>
            </div>
        `;
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

    showProfileDropdown() {
        // Create dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'profile-dropdown';
        dropdown.innerHTML = `
            <div class="dropdown-content">
                <a href="#" class="dropdown-item"><i class="fas fa-user"></i> My Profile</a>
                <a href="#" class="dropdown-item"><i class="fas fa-cog"></i> Settings</a>
                <div class="dropdown-divider"></div>
                <a href="#" class="dropdown-item logout-btn"><i class="fas fa-sign-out-alt"></i> Logout</a>
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
        localStorage.removeItem('adminToken');
        window.location.href = 'admin-login.html';
    }

    showNotifications() {
        // Show notifications dropdown
        console.log('Show notifications');
    }
}

// Initialize layout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardLayout = new AdminDashboardLayout();
});