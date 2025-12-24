// js/reservation.js
class ReservationManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadItemsForReservation();
        this.setupEventListeners();
        this.loadFromURL();
        this.initDatePicker();
    }

    loadItemsForReservation() {
        const select = document.getElementById('item-select');
        if (!select) return;
        
        const items = database.getAllItems();
        
        // Vider les options existantes
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Ajouter les items
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            
            const typeText = item.localisation ? 'Résidence' : 'Véhicule';
            const categorieText = item.categorie === 'vente' ? 'À vendre' : 'À louer';
            const prixText = formatPrice(item.prix, item.categorie === 'location');
            
            option.textContent = `${typeText}: ${item.titre} - ${categorieText} - ${prixText}`;
            select.appendChild(option);
        });
    }

    setupEventListeners() {
        const itemSelect = document.getElementById('item-select');
        if (itemSelect) {
            itemSelect.addEventListener('change', () => {
                this.updateSelectedItem();
                this.updateSummary();
            });
        }
        
        const form = document.getElementById('reservationForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
        
        // Mettre à jour le récapitulatif en temps réel
        const inputs = ['nom', 'email', 'telephone', 'date'];
        inputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('input', () => this.updateSummary());
            }
        });
    }

    loadFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const itemId = urlParams.get('item');
        const itemType = urlParams.get('type');
        
        if (itemId) {
            const item = database.getItemById(itemId);
            if (item) {
                document.getElementById('item-select').value = itemId;
                this.updateSelectedItem();
                this.updateSummary();
            }
        }
    }

    initDatePicker() {
        const dateInput = document.getElementById('date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            dateInput.value = today;
        }
    }

    updateSelectedItem() {
        const itemId = document.getElementById('item-select').value;
        const item = database.getItemById(itemId);
        const detailsDiv = document.getElementById('item-details');
        
        if (item && detailsDiv) {
            document.getElementById('item-title').textContent = item.titre;
            document.getElementById('item-price').textContent = formatPrice(item.prix, item.categorie === 'location');
            document.getElementById('item-description').textContent = item.description || 'Pas de description';
            detailsDiv.style.display = 'block';
        } else if (detailsDiv) {
            detailsDiv.style.display = 'none';
        }
    }

    updateSummary() {
        const itemId = document.getElementById('item-select').value;
        const item = database.getItemById(itemId);
        const nom = document.getElementById('nom')?.value || '';
        const date = document.getElementById('date')?.value || '';
        
        // Mettre à jour l'image
        const summaryImage = document.getElementById('summaryImage');
        if (summaryImage) {
            summaryImage.src = item?.image || 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80';
        }
        
        // Mettre à jour les informations
        if (item) {
            document.getElementById('summaryItem').textContent = item.titre;
            document.getElementById('summaryDetails').textContent = 
                item.description?.substring(0, 80) + '...' || 'Pas de description';
            document.getElementById('summaryPrice').textContent = formatPrice(item.prix, item.categorie === 'location');
            
            const serviceType = item.localisation ? 
                'Location résidence' : 
                (item.categorie === 'vente' ? 'Achat véhicule' : 'Location véhicule');
            
            document.getElementById('summaryService').textContent = serviceType;
        } else {
            document.getElementById('summaryItem').textContent = 'Sélectionnez un Article';
            document.getElementById('summaryDetails').textContent = '-';
            document.getElementById('summaryPrice').textContent = '-';
            document.getElementById('summaryService').textContent = 'Réservation';
        }
        
        // Mettre à jour la date
        if (date) {
            const dateObj = new Date(date);
            const formattedDate = dateObj.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            document.getElementById('summaryDate').textContent = formattedDate;
        } else {
            document.getElementById('summaryDate').textContent = 'À définir';
        }
        
        // Mettre à jour le client
        document.getElementById('summaryClient').textContent = nom || 'À remplir';
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Validation
        const validation = this.validateForm();
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                Notification.show(error, 'error');
            });
            return;
        }
        
        // Préparer les données
        const reservationData = {
            itemId: parseInt(document.getElementById('item-select').value),
            nom: document.getElementById('nom').value.trim(),
            email: document.getElementById('email').value.trim(),
            telephone: document.getElementById('telephone').value.trim(),
            date: document.getElementById('date').value,
            message: document.getElementById('message').value.trim()
        };
        
        // Récupérer les détails de l'item
        const item = database.getItemById(reservationData.itemId);
        if (!item) {
            Notification.show('Veuillez sélectionner un article', 'error');
            return;
        }
        
        // Ajouter les détails de l'item
        reservationData.item = item.titre;
        reservationData.itemType = item.localisation ? 'residence' : 'vehicule';
        reservationData.prix = item.prix;
        
        // Bouton en cours de traitement
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
        submitBtn.disabled = true;
        
        try {
            // Sauvegarder la réservation
            const success = await database.addReservation(reservationData);
            
            if (success) {
                // Afficher la confirmation
                this.showConfirmation(reservationData, item);
                
                // Envoyer la notification WhatsApp
                this.sendWhatsAppNotification(reservationData, item);
                
                // Réinitialiser le formulaire
                e.target.reset();
                document.getElementById('item-details').style.display = 'none';
                this.initDatePicker();
                this.updateSummary();
            } else {
                throw new Error('Erreur lors de l\'enregistrement');
            }
        } catch (error) {
            console.error('Erreur réservation:', error);
            Notification.show('Une erreur est survenue. Veuillez réessayer.', 'error');
        } finally {
            // Restaurer le bouton
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    validateForm() {
        const errors = [];
        const requiredFields = ['nom', 'email', 'telephone', 'date', 'item-select'];
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                errors.push(`Le champ ${this.getFieldLabel(fieldId)} est requis`);
                field?.classList.add('error');
            } else {
                field?.classList.remove('error');
            }
        });
        
        // Validation email
        const email = document.getElementById('email');
        if (email && email.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value)) {
                errors.push('Format d\'email invalide');
                email.classList.add('error');
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    getFieldLabel(fieldId) {
        const labels = {
            'nom': 'Nom complet',
            'email': 'Email',
            'telephone': 'Téléphone',
            'date': 'Date',
            'item-select': 'Article'
        };
        return labels[fieldId] || fieldId;
    }

    showConfirmation(reservation, item) {
        const modal = document.getElementById('confirmationModal');
        const modalMessage = document.getElementById('modalMessage');
        
        if (!modal || !modalMessage) return;
        
        const message = `
            Votre réservation pour "${item.titre}" a été enregistrée avec succès.<br><br>
            <strong>Prix:</strong> ${formatPrice(item.prix, item.categorie === 'location')}<br>
            <strong>Date:</strong> ${new Date(reservation.date).toLocaleDateString('fr-FR')}<br><br>
            Notre équipe vous contactera au <strong>${reservation.telephone}</strong> dans les plus brefs délais.
        `;
        
        modalMessage.innerHTML = message;
        modal.style.display = 'flex';
    }

    sendWhatsAppNotification(reservation, item) {
        try {
            const settings = database.getSettings();
            const businessName = settings.name || 'GRÂCE AUTO SERVICE-CI-BKT';
            const whatsappNumber = '2250748735115';
            
            const itemType = item.localisation ? 'Résidence' : 'Véhicule';
            const serviceType = item.categorie === 'vente' ? 'Achat' : 'Location';
            
            let message = `🛎️ *NOUVELLE RÉSERVATION - ${businessName}* 🛎️\n\n`;
            message += `*📋 SERVICE:* ${serviceType} ${itemType}\n`;
            message += `*${itemType === 'Résidence' ? '🏠' : '🚗'} ÉLÉMENT:* ${item.titre}\n`;
            message += `*💰 MONTANT:* ${formatPrice(item.prix, item.categorie === 'location')}\n\n`;
            message += `*👤 INFORMATIONS CLIENT:*\n`;
            message += `• *Nom:* ${reservation.nom}\n`;
            message += `• *Email:* ${reservation.email || 'Non fourni'}\n`;
            message += `• *Téléphone:* ${reservation.telephone}\n`;
            message += `• *Date souhaitée:* ${new Date(reservation.date).toLocaleDateString('fr-FR')}\n\n`;
            
            if (reservation.message) {
                message += `*💬 MESSAGE:*\n${reservation.message}\n\n`;
            }
            
            message += `---\n`;
            message += `*📧 Contact:* ${settings.contactEmail || 'graceautoservice88@gmail.com'}\n`;
            message += `*📞 Téléphone:* ${settings.contactPhone || '+225 0748735115'}\n`;
            message += `*🕒 Date:* ${new Date().toLocaleString('fr-FR')}`;
            
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
            
            // Ouvrir dans un nouvel onglet
            window.open(whatsappUrl, '_blank');
            
        } catch (error) {
            console.error('Erreur WhatsApp:', error);
            // Fallback simple
            window.open(`https://wa.me/2250748735115`, '_blank');
        }
    }

    closeModal() {
        const modal = document.getElementById('confirmationModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
}

// Initialiser le gestionnaire de réservation
let reservationManager;

document.addEventListener('DOMContentLoaded', () => {
    reservationManager = new ReservationManager();
    window.reservationManager = reservationManager;
    
    // Écouter les mises à jour
    window.addEventListener('databaseUpdated', () => {
        reservationManager.loadItemsForReservation();
    });
    
    // Gestion de la fermeture modale
    window.closeModal = () => reservationManager.closeModal();
    
    // Fermer avec ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            reservationManager.closeModal();
        }
    });
    
    // Fermer en cliquant à l'extérieur
    window.onclick = (e) => {
        const modal = document.getElementById('confirmationModal');
        if (e.target === modal) {
            reservationManager.closeModal();
        }
    };
});