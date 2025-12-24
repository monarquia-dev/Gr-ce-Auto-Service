// js/main.js
// Fonctions utilitaires pour toutes les pages

// Initialiser les paramètres du site
function initializeSiteSettings() {
    const settings = database.getSettings();
    
    if (settings) {
        // Mettre à jour le nom du site
        const siteNameElements = document.querySelectorAll('#siteName, #footerSiteName, #copyrightSiteName');
        siteNameElements.forEach(el => {
            if (el) el.textContent = settings.name || 'GRÂCE AUTO SERVICE-CI-BKT';
        });
        
        // Mettre à jour la description
        const descElements = document.querySelectorAll('#footerDescription, #pageDescription');
        descElements.forEach(el => {
            if (el) el.textContent = settings.description || 'Vente • Location • Assurance';
        });
        
        // Mettre à jour les téléphones
        const phone1 = document.getElementById('footerPhone1');
        const phone2 = document.getElementById('footerPhone2');
        
        if (phone1 && settings.contactPhone) {
            phone1.href = `tel:${settings.contactPhone.replace(/\s+/g, '')}`;
            const span = phone1.querySelector('span');
            if (span) span.textContent = settings.contactPhone;
        }
        
        if (phone2 && settings.otherPhones && settings.otherPhones[0]) {
            phone2.href = `tel:${settings.otherPhones[0].replace(/\s+/g, '')}`;
            const span = phone2.querySelector('span');
            if (span) span.textContent = settings.otherPhones[0];
        }
        
        // Mettre à jour l'email
        const email = document.getElementById('footerEmail');
        if (email && settings.contactEmail) {
            email.href = `mailto:${settings.contactEmail}`;
            const span = email.querySelector('span');
            if (span) span.textContent = settings.contactEmail;
        }
        
        // Mettre à jour les horaires
        const hours1 = document.getElementById('footerHours1');
        const hours2 = document.getElementById('footerHours2');
        
        if (hours1 && settings.businessHours && settings.businessHours.weekday) {
            hours1.textContent = settings.businessHours.weekday;
        }
        
        if (hours2 && settings.businessHours && settings.businessHours.saturday) {
            hours2.textContent = settings.businessHours.saturday;
        }
    }
}

// Formater un prix
function formatPrice(price, isMonthly = false) {
    if (!price) return 'Prix sur demande';
    const formatted = new Intl.NumberFormat('fr-FR').format(price);
    return `${formatted} FCFA${isMonthly ? '/mois' : ''}`;
}

// Créer une carte de véhicule
function createVehicleCard(vehicle) {
    return `
        <div class="vehicle-card">
            <div class="vehicle-image">
                <img src="${vehicle.image || 'images/default-car.jpg'}" 
                     alt="${vehicle.titre}" 
                     onerror="this.src='images/default-car.jpg'">
                <span class="vehicle-badge">${vehicle.categorie === 'vente' ? 'À vendre' : 'À louer'}</span>
                <span class="vehicle-status ${vehicle.disponible ? 'available' : 'unavailable'}">
                    ${vehicle.disponible ? 'Disponible' : 'Non disponible'}
                </span>
            </div>
            <div class="vehicle-info">
                <h3>${vehicle.titre}</h3>
                <div class="vehicle-details">
                    <span><i class="fas fa-car"></i> ${vehicle.type || 'Non spécifié'}</span>
                    <span><i class="fas fa-tag"></i> ${formatPrice(vehicle.prix, vehicle.categorie === 'location')}</span>
                </div>
                <p class="vehicle-description">${vehicle.description?.substring(0, 100) || 'Description non disponible'}...</p>
                <div class="vehicle-features">
                    ${(vehicle.caracteristiques || []).slice(0, 3).map(feature => 
                        `<span class="feature-tag">${feature}</span>`
                    ).join('')}
                </div>
                <div class="vehicle-actions">
                    <a href="reservation.html?item=${vehicle.id}" class="btn btn-primary">
                        ${vehicle.categorie === 'vente' ? 'Acheter' : 'Louer'}
                    </a>
                    <button class="btn btn-secondary" onclick="showItemDetails(${vehicle.id})">
                        Détails
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Créer une carte de résidence
function createResidenceCard(residence) {
    return `
        <div class="residence-card">
            <div class="residence-image">
                <img src="${residence.image || 'images/default-house.jpg'}" 
                     alt="${residence.titre}"
                     onerror="this.src='images/default-house.jpg'">
                <span class="residence-badge">Résidence</span>
                <span class="residence-status ${residence.disponible ? 'available' : 'unavailable'}">
                    ${residence.disponible ? 'Disponible' : 'Louée'}
                </span>
            </div>
            <div class="residence-info">
                <h3>${residence.titre}</h3>
                <div class="residence-details">
                    <span><i class="fas fa-map-marker-alt"></i> ${residence.localisation || 'Non spécifiée'}</span>
                    <span><i class="fas fa-tag"></i> ${formatPrice(residence.prix, true)}</span>
                </div>
                <p class="residence-description">
                    ${residence.description?.substring(0, 100) || 'Résidence de qualité...'}...
                </p>
                <div class="residence-features">
                    ${(residence.caracteristiques || []).slice(0, 3).map(feature => 
                        `<span class="feature-tag">${feature}</span>`
                    ).join('')}
                </div>
                <div class="residence-actions">
                    <a href="reservation.html?item=${residence.id}" class="btn btn-primary">
                        Réserver
                    </a>
                    <button class="btn btn-secondary" onclick="showResidenceDetails(${residence.id})">
                        Détails
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Afficher les détails d'un item
function showItemDetails(itemId) {
    const item = database.getItemById(itemId);
    if (item) {
        const details = `
            <div style="text-align: left;">
                <h3>${item.titre}</h3>
                <p><strong>Prix:</strong> ${formatPrice(item.prix, item.categorie === 'location')}</p>
                ${item.type ? `<p><strong>Type:</strong> ${item.type}</p>` : ''}
                ${item.localisation ? `<p><strong>Localisation:</strong> ${item.localisation}</p>` : ''}
                <p><strong>Description:</strong> ${item.description || 'Non disponible'}</p>
                ${item.caracteristiques && item.caracteristiques.length > 0 ? 
                    `<p><strong>Caractéristiques:</strong> ${item.caracteristiques.join(', ')}</p>` : ''}
                <p><strong>Statut:</strong> ${item.disponible ? 'Disponible' : 'Non disponible'}</p>
            </div>
        `;
        
        // Utiliser SweetAlert2 si disponible, sinon alert()
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Détails',
                html: details,
                icon: 'info',
                confirmButtonText: 'Fermer',
                confirmButtonColor: '#1a3a8f'
            });
        } else {
            alert(details);
        }
    }
}

// Gestionnaire de notifications
class Notification {
    static show(message, type = 'info', duration = 3000) {
        const container = document.getElementById('notification-container') || 
                         (() => {
                             const div = document.createElement('div');
                             div.id = 'notification-container';
                             div.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000;';
                             document.body.appendChild(div);
                             return div;
                         })();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.style.cssText = `
            background: white;
            padding: 15px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border-left: 4px solid;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
            min-width: 300px;
            color: #333;
            font-size: 14px;
        `;
        
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#1a3a8f'
        };
        
        notification.style.borderLeftColor = colors[type] || colors.info;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}" 
               style="color: ${colors[type] || colors.info}; font-size: 18px;"></i>
            <span style="flex: 1;">${message}</span>
            <button onclick="this.parentElement.remove()" 
                    style="background: none; border: none; cursor: pointer; color: #666;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
        
        // Ajouter l'animation CSS
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .notification {
                    animation: slideIn 0.3s ease;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// Validation de formulaire
function validateForm(formData) {
    const errors = [];
    
    if (!formData.nom || formData.nom.trim().length < 2) {
        errors.push('Le nom est requis (min. 2 caractères)');
    }
    
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        errors.push('Email invalide');
    }
    
    if (!formData.telephone || !/^[\d\s\+\(\)-]+$/.test(formData.telephone)) {
        errors.push('Numéro de téléphone invalide');
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Initialiser la date minimum pour les réservations
function initDatePicker() {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        dateInput.value = today;
    }
}

// Écouteur d'événement pour la base de données
document.addEventListener('DOMContentLoaded', function() {
    // Initialiser les paramètres du site
    initializeSiteSettings();
    
    // Initialiser les dates
    initDatePicker();
    
    // Mettre à jour l'année en cours
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Écouter les mises à jour de la base de données
    window.addEventListener('databaseUpdated', function() {
        initializeSiteSettings();
    });
    
    // Vérifier la connexion Firebase
    setTimeout(() => {
        if (database && database.data) {
            console.log('✅ Site initialisé avec succès');
        } else {
            console.warn('⚠️ Mode hors ligne activé');
        }
    }, 1000);
});

// Exporter les fonctions globales
window.formatPrice = formatPrice;
window.showItemDetails = showItemDetails;
window.Notification = Notification;