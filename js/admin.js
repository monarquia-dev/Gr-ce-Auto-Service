// js/admin.js - Gestion de l'administration
class AdminManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentItemType = null;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.loadDashboard();
        this.setupEventListeners();
    }

    setupNavigation() {
        document.querySelectorAll('.admin-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = link.getAttribute('href').substring(1);
                this.showSection(sectionId);
            });
        });
    }

    showSection(sectionId) {
        // Mettre à jour la navigation active
        document.querySelectorAll('.admin-menu a').forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === `#${sectionId}`) {
                a.classList.add('active');
            }
        });

        // Afficher la section
        document.querySelectorAll('.admin-section').forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
                this.currentSection = sectionId;
                this.loadSectionData(sectionId);
            }
        });
    }

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'dashboard':
                this.loadDashboard();
                break;
            case 'vehicules':
                this.loadVehiculesAdmin();
                break;
            case 'locations':
                this.loadLocationsAdmin();
                break;
            case 'residences':
                this.loadResidencesAdmin();
                break;
            case 'reservations':
                this.loadReservationsAdmin();
                break;
            case 'database':
                this.loadDatabaseStats();
                break;
        }
    }

    loadDashboard() {
        const stats = database.getStats();
        
        // Mettre à jour les statistiques
        document.getElementById('count-admin-vehicules').textContent = stats.vehiculesVente;
        document.getElementById('count-admin-locations').textContent = stats.vehiculesLocation;
        document.getElementById('count-admin-residences').textContent = stats.totalResidences;
        document.getElementById('count-admin-reservations').textContent = stats.totalReservations;
        
        // Charger l'activité récente
        this.loadRecentActivity();
    }

    loadRecentActivity() {
        const container = document.getElementById('recent-activity');
        if (!container) return;
        
        const allItems = database.getAllItems();
        const recentItems = allItems
            .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
            .slice(0, 5);
        
        container.innerHTML = recentItems.map(item => `
            <div class="recent-item">
                <div class="recent-item-info">
                    <h4>${item.titre}</h4>
                    <p class="recent-item-price">${formatPrice(item.prix, item.categorie === 'location')}</p>
                    <p class="recent-item-type">${item.localisation ? 'Résidence' : 'Véhicule'}</p>
                </div>
                <div class="recent-item-actions">
                    <span class="badge ${item.localisation ? 'residence' : 'vehicule'}">
                        ${item.localisation ? 'Résidence' : 'Véhicule'}
                    </span>
                    <button class="btn-outline-admin" onclick="adminManager.editItem(${item.id})">
                        Éditer
                    </button>
                </div>
            </div>
        `).join('');
    }

    loadVehiculesAdmin() {
        const container = document.getElementById('vehicules-list');
        if (!container) return;
        
        const vehicules = database.getVehicules();
        
        container.innerHTML = vehicules.map(v => this.createAdminItemCard(v, 'véhicule')).join('');
    }

    loadLocationsAdmin() {
        const container = document.getElementById('locations-list');
        if (!container) return;
        
        const locations = database.getLocations();
        
        container.innerHTML = locations.map(l => this.createAdminItemCard(l, 'location')).join('');
    }

    loadResidencesAdmin() {
        const container = document.getElementById('residences-list');
        if (!container) return;
        
        const residences = database.getResidences();
        
        container.innerHTML = residences.map(r => this.createAdminItemCard(r, 'residence')).join('');
    }

    loadReservationsAdmin() {
        const container = document.getElementById('reservations-list');
        if (!container) return;
        
        const reservations = database.getReservations();
        
        container.innerHTML = reservations.map(r => this.createAdminReservationCard(r)).join('');
    }

    createAdminItemCard(item, type) {
        const isResidence = type === 'residence';
        
        return `
            <div class="item-card" style="margin-bottom: 15px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 20px;">
                    <img src="${item.image || (isResidence ? 'images/default-house.jpg' : 'images/default-car.jpg')}" 
                         style="width: 100px; height: 70px; object-fit: cover; border-radius: 4px;"
                         onerror="this.src='${isResidence ? 'images/default-house.jpg' : 'images/default-car.jpg'}'">
                    <div style="flex: 1;">
                        <h4>${item.titre || 'Sans titre'}</h4>
                        <p>${formatPrice(item.prix, item.categorie === 'location')}</p>
                        <p style="color: ${item.disponible ? '#2ecc71' : '#e74c3c'}; font-weight: 600;">
                            ${item.disponible ? 'Disponible' : 'Non disponible'}
                        </p>
                        ${isResidence ? 
                            `<p><i class="fas fa-map-marker-alt"></i> ${item.localisation || 'Non spécifiée'}</p>` :
                            `<p><i class="fas fa-car"></i> ${item.type || 'Non spécifié'}</p>`
                        }
                    </div>
                    <div class="item-actions-admin">
                        <button class="btn-admin btn-edit" onclick="adminManager.editItem(${item.id})">
                            <i class="fas fa-edit"></i> Modifier
                        </button>
                        <button class="btn-admin btn-delete" onclick="adminManager.deleteItem(${item.id})">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                        <button class="btn-admin btn-status" onclick="adminManager.toggleDisponible(${item.id})">
                            ${item.disponible ? 'Indisponible' : 'Disponible'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    createAdminReservationCard(reservation) {
        const item = database.getItemById(reservation.itemId);
        
        return `
            <div class="reservation-item ${reservation.statut || 'pending'}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex: 1;">
                        <h4>${item ? item.titre : 'Item non trouvé'}</h4>
                        <p><strong>Client:</strong> ${reservation.nom} (${reservation.email})</p>
                        <p><strong>Téléphone:</strong> ${reservation.telephone}</p>
                        <p><strong>Date souhaitée:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Statut:</strong> 
                            <span class="badge ${reservation.statut}">${reservation.statut || 'En attente'}</span>
                        </p>
                        ${reservation.message ? `<p><strong>Message:</strong> ${reservation.message}</p>` : ''}
                    </div>
                    <div style="display: flex; gap: 10px; flex-direction: column;">
                        <button class="btn btn-small" onclick="adminManager.updateReservationStatus(${reservation.id}, 'confirmée')">
                            Confirmer
                        </button>
                        <button class="btn btn-small btn-danger" onclick="adminManager.updateReservationStatus(${reservation.id}, 'annulée')">
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    loadDatabaseStats() {
        const container = document.getElementById('db-stats');
        if (!container) return;
        
        const stats = database.getStats();
        const settings = database.getSettings();
        
        container.innerHTML = `
            <pre style="background: #f8f9fa; padding: 15px; border-radius: 6px;">
📊 STATISTIQUES DE LA BASE DE DONNÉES

Véhicules en vente: ${stats.vehiculesVente}
Véhicules en location: ${stats.vehiculesLocation}
Résidences: ${stats.totalResidences}
Réservations: ${stats.totalReservations}
  • En attente: ${stats.reservationsEnAttente}
  • Confirmées: ${stats.reservationsConfirmees}

PARAMÈTRES DU SITE
Nom: ${settings.name || 'Non défini'}
Téléphone: ${settings.contactPhone || 'Non défini'}
Email: ${settings.contactEmail || 'Non défini'}

DERNIÈRE SYNCHRONISATION
${new Date().toLocaleString('fr-FR')}
            </pre>
        `;
    }

    setupEventListeners() {
        // Boutons d'ajout
        document.getElementById('add-vehicule-btn')?.addEventListener('click', () => {
            this.openItemModal('vehicule', 'vente');
        });
        
        document.getElementById('add-location-btn')?.addEventListener('click', () => {
            this.openItemModal('vehicule', 'location');
        });
        
        document.getElementById('add-residence-btn')?.addEventListener('click', () => {
            this.openItemModal('residence', 'location');
        });
        
        // Actions rapides
        document.getElementById('add-vehicule-quick')?.addEventListener('click', () => {
            this.openItemModal('vehicule', 'vente');
        });
        
        document.getElementById('add-residence-quick')?.addEventListener('click', () => {
            this.openItemModal('residence', 'location');
        });
        
        // Gestion base de données
        document.getElementById('export-btn')?.addEventListener('click', this.exportDatabase);
        document.getElementById('import-btn')?.addEventListener('click', this.importDatabase);
        document.getElementById('backup-btn')?.addEventListener('click', this.backupDatabase);
        document.getElementById('reset-btn')?.addEventListener('click', this.resetDatabase);
    }

    openItemModal(type, categorie, itemId = null) {
        const modal = document.getElementById('item-modal');
        const title = document.getElementById('modal-title');
        
        this.currentItemType = type;
        
        // Configurer le formulaire selon le type
        const typeContainer = document.getElementById('type-container');
        const localisationContainer = document.getElementById('localisation-container');
        
        if (type === 'residence') {
            title.textContent = itemId ? 'Modifier la résidence' : 'Ajouter une résidence';
            typeContainer.style.display = 'none';
            localisationContainer.style.display = 'block';
        } else {
            title.textContent = itemId ? 'Modifier le véhicule' : 'Ajouter un véhicule';
            typeContainer.style.display = 'block';
            localisationContainer.style.display = 'none';
        }
        
        // Remplir le formulaire si modification
        if (itemId) {
            const item = database.getItemById(itemId);
            if (item) {
                document.getElementById('item-id').value = item.id;
                document.getElementById('item-titre').value = item.titre || '';
                document.getElementById('item-prix').value = item.prix || '';
                document.getElementById('item-type').value = item.type || '';
                document.getElementById('item-localisation').value = item.localisation || '';
                document.getElementById('item-description').value = item.description || '';
                document.getElementById('item-image').value = item.image || '';
                document.getElementById('item-caracteristiques').value = 
                    Array.isArray(item.caracteristiques) ? item.caracteristiques.join(', ') : item.caracteristiques || '';
                document.getElementById('item-disponible').checked = item.disponible !== false;
                document.getElementById('item-categorie').value = item.categorie || categorie;
            }
        } else {
            document.getElementById('item-form').reset();
            document.getElementById('item-id').value = '';
            document.getElementById('item-categorie').value = categorie;
            document.getElementById('item-disponible').checked = true;
        }
        
        modal.style.display = 'block';
    }

    saveItem() {
        const form = document.getElementById('item-form');
        const itemId = document.getElementById('item-id').value;
        const categorie = document.getElementById('item-categorie').value;
        const isResidence = this.currentItemType === 'residence';
        
        const itemData = {
            titre: document.getElementById('item-titre').value,
            prix: parseFloat(document.getElementById('item-prix').value) || 0,
            categorie: categorie,
            description: document.getElementById('item-description').value,
            image: document.getElementById('item-image').value,
            caracteristiques: document.getElementById('item-caracteristiques').value
                .split(',')
                .map(f => f.trim())
                .filter(f => f !== ''),
            disponible: document.getElementById('item-disponible').checked
        };
        
        if (!isResidence) {
            itemData.type = document.getElementById('item-type').value;
        } else {
            itemData.localisation = document.getElementById('item-localisation').value;
        }
        
        if (itemId) {
            // Mise à jour
            database.updateItem(itemId, itemData)
                .then(success => {
                    if (success) {
                        Notification.show('Item modifié avec succès', 'success');
                        this.loadSectionData(this.currentSection);
                    }
                });
        } else {
            // Création
            if (isResidence) {
                database.addResidence(itemData)
                    .then(success => {
                        if (success) {
                            Notification.show('Résidence ajoutée avec succès', 'success');
                            this.loadSectionData(this.currentSection);
                        }
                    });
            } else {
                database.addVehicule(itemData)
                    .then(success => {
                        if (success) {
                            Notification.show('Véhicule ajouté avec succès', 'success');
                            this.loadSectionData(this.currentSection);
                        }
                    });
            }
        }
        
        document.getElementById('item-modal').style.display = 'none';
    }

    editItem(id) {
        const item = database.getItemById(id);
        if (item) {
            const isResidence = !!item.localisation;
            this.openItemModal(isResidence ? 'residence' : 'vehicule', item.categorie || 'vente', id);
        }
    }

    deleteItem(id) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet item ? Cette action est irréversible.')) {
            database.deleteItem(id)
                .then(success => {
                    if (success) {
                        Notification.show('Item supprimé avec succès', 'success');
                        this.loadSectionData(this.currentSection);
                    }
                });
        }
    }

    toggleDisponible(id) {
        const item = database.getItemById(id);
        if (item) {
            database.updateItem(id, { disponible: !item.disponible })
                .then(success => {
                    if (success) {
                        Notification.show(
                            `Statut changé: ${!item.disponible ? 'Disponible' : 'Non disponible'}`,
                            'info'
                        );
                        this.loadSectionData(this.currentSection);
                    }
                });
        }
    }

    updateReservationStatus(id, statut) {
        database.updateReservationStatus(id, statut)
            .then(success => {
                if (success) {
                    Notification.show(`Réservation ${statut}`, 'success');
                    this.loadReservationsAdmin();
                }
            });
    }

    exportDatabase() {
        const data = database.exportDatabase();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vente-location-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Notification.show('Base exportée avec succès', 'success');
    }

    importDatabase() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                if (confirm('Attention ! L\'importation remplacera toutes les données actuelles. Continuer ?')) {
                    database.importDatabase(event.target.result)
                        .then(success => {
                            if (success) {
                                Notification.show('Base importée avec succès', 'success');
                                this.loadDashboard();
                            }
                        });
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    backupDatabase() {
        localStorage.setItem('venteLocationDB_backup', JSON.stringify(database.data));
        Notification.show('Sauvegarde locale créée', 'success');
    }

    resetDatabase() {
        if (confirm('⚠️ ATTENTION ! Cette action réinitialisera toutes les données aux valeurs par défaut. Continuer ?')) {
            database.initializeDefaultData()
                .then(() => {
                    Notification.show('Base réinitialisée avec succès', 'success');
                    this.loadDashboard();
                });
        }
    }
}

// Initialiser l'admin
let adminManager;

document.addEventListener('DOMContentLoaded', () => {
    adminManager = new AdminManager();
    window.adminManager = adminManager;
    
    // Gestion du formulaire
    document.getElementById('item-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        adminManager.saveItem();
    });
    
    // Fermer le modal
    document.querySelector('.close-modal')?.addEventListener('click', () => {
        document.getElementById('item-modal').style.display = 'none';
    });
    
    // Fermer en cliquant à l'extérieur
    window.onclick = (event) => {
        const modal = document.getElementById('item-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
});