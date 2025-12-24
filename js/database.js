// BASE DE DONNÉES CENTRALE - Synchronisée avec localStorage
class Database {
    constructor() {
        this.data = this.loadFromStorage();
        
        // Si pas de données, initialiser avec des données par défaut
        if (!this.data || !this.data.vehicules) {
            this.initializeDefaultData();
        }
    }

    initializeDefaultData() {
        this.data = {
            vehicules: [
                {
                    id: 1,
                    titre: "Toyota RAV4 2023",
                    categorie: "vente",
                    prix: 32000,
                    image: "images/télécharger.webp",
                    description: "SUV familial en excellent état",
                    caracteristiques: ["4x4", "Automatique", "Climatisation", "Camera de recul"],
                    disponible: true,
                    type: "SUV"
                },
                {
                    id: 2,
                    titre: "Mercedes Classe A",
                    categorie: "location",
                    prix: 450,
                    image: "images/télécharger.webp",
                    description: "Location mensuelle avec option d'achat",
                    caracteristiques: ["Diesel", "Automatique", "Toit ouvrant"],
                    disponible: true,
                    type: "Berline"
                }
            ],
            locations: [
                {
                    id: 1,
                    titre: "Peugeot 3008",
                    categorie: "location",
                    prix: 350,
                    image: "images/télécharger.webp",
                    description: "Location à la semaine ou au mois",
                    caracteristiques: ["SUV", "Essence", 5],
                    disponible: true,
                    type: "SUV"
                }
            ],
            residences: [
                {
                    id: 1,
                    titre: "Appartement Moderne 3 pièces",
                    categorie: "location",
                    prix: 850,
                    image: "images/appartement-paris.jpg",
                    description: "Appartement neuf au cœur de Paris",
                    caracteristiques: ["80m²", "3 chambres", "Balcon", "Ascenseur"],
                    disponible: true,
                    localisation: "Paris 15ème"
                }
            ],
            reservations: [],
            lastUpdate: new Date().toISOString()
        };
        
        this.saveToStorage();
    }

    // Charger depuis localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('venteLocationDB');
        return saved ? JSON.parse(saved) : null;
    }

    // Sauvegarder dans localStorage
    saveToStorage() {
        this.data.lastUpdate = new Date().toISOString();
        localStorage.setItem('venteLocationDB', JSON.stringify(this.data));
        
        // Déclencher événement de synchronisation
        this.triggerSync();
    }

    // Événement pour synchroniser toutes les pages
    triggerSync() {
        const event = new CustomEvent('databaseUpdated', {
            detail: { timestamp: new Date() }
        });
        window.dispatchEvent(event);
    }

    // Méthodes pour les véhicules
    getVehicules() {
        return this.data.vehicules.filter(v => v.categorie === "vente");
    }

    getLocations() {
        return this.data.vehicules.filter(v => v.categorie === "location");
    }

    getResidences() {
        return this.data.residences;
    }

    getAllItems() {
        return [...this.data.vehicules, ...this.data.residences];
    }

    getItemById(id) {
        const allItems = this.getAllItems();
        return allItems.find(item => item.id === parseInt(id));
    }

    addVehicule(vehicule) {
        vehicule.id = Date.now();
        vehicule.disponible = true;
        this.data.vehicules.push(vehicule);
        this.saveToStorage();
        return vehicule;
    }

    addResidence(residence) {
        residence.id = Date.now();
        residence.disponible = true;
        residence.categorie = "location";
        this.data.residences.push(residence);
        this.saveToStorage();
        return residence;
    }

    updateItem(id, updatedData) {
        let updated = false;
        
        // Chercher dans les véhicules
        const vehiculeIndex = this.data.vehicules.findIndex(v => v.id === id);
        if (vehiculeIndex !== -1) {
            this.data.vehicules[vehiculeIndex] = { 
                ...this.data.vehicules[vehiculeIndex], 
                ...updatedData 
            };
            updated = true;
        }
        
        // Chercher dans les résidences
        const residenceIndex = this.data.residences.findIndex(r => r.id === id);
        if (residenceIndex !== -1) {
            this.data.residences[residenceIndex] = { 
                ...this.data.residences[residenceIndex], 
                ...updatedData 
            };
            updated = true;
        }
        
        if (updated) {
            this.saveToStorage();
        }
        
        return updated;
    }

    deleteItem(id) {
        const vehiculeIndex = this.data.vehicules.findIndex(v => v.id === id);
        if (vehiculeIndex !== -1) {
            this.data.vehicules.splice(vehiculeIndex, 1);
            this.saveToStorage();
            return true;
        }
        
        const residenceIndex = this.data.residences.findIndex(r => r.id === id);
        if (residenceIndex !== -1) {
            this.data.residences.splice(residenceIndex, 1);
            this.saveToStorage();
            return true;
        }
        
        return false;
    }

    // Réservations
    addReservation(reservation) {
        reservation.id = Date.now();
        reservation.date = new Date().toISOString();
        reservation.statut = "en attente";
        this.data.reservations.push(reservation);
        this.saveToStorage();
        return reservation;
    }

    getReservations() {
        return this.data.reservations;
    }

    updateReservationStatus(id, statut) {
        const reservation = this.data.reservations.find(r => r.id === id);
        if (reservation) {
            reservation.statut = statut;
            this.saveToStorage();
            return true;
        }
        return false;
    }

    // Export/Import
    exportDatabase() {
        return JSON.stringify(this.data, null, 2);
    }

    importDatabase(jsonData) {
        try {
            const importedData = JSON.parse(jsonData);
            this.data = importedData;
            this.saveToStorage();
            return true;
        } catch (error) {
            console.error("Erreur d'import:", error);
            return false;
        }
    }
}

// Instance globale
const database = new Database();
// Ajouter dans database.js
class Security {
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/[<>]/g, '') // Supprime les balises HTML
            .trim()
            .substring(0, 1000); // Limite la longueur
    }

    static validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    static validatePhone(phone) {
        const phoneRegex = /^[0-9\s\+\-\(\)]{10,15}$/;
        return phoneRegex.test(phone);
    }
}
// Ajouter dans database.js
class Auth {
    static login(username, password) {
        // En production, utiliser un backend sécurisé
        const adminUser = localStorage.getItem('adminUser');
        if (!adminUser) {
            // Premier login - créer l'admin
            if (username === 'admin' && password === 'admin123') {
                const token = btoa(Date.now() + '|' + username);
                localStorage.setItem('adminToken', token);
                localStorage.setItem('adminUser', JSON.stringify({
                    username,
                    lastLogin: new Date().toISOString()
                }));
                return true;
            }
        }
        // Vérifier le token existant
        const token = localStorage.getItem('adminToken');
        return !!token;
    }

    static logout() {
        localStorage.removeItem('adminToken');
        window.location.href = 'index.html';
    }

    static isAuthenticated() {
        return !!localStorage.getItem('adminToken');
    }

    static protectRoute() {
        if (!this.isAuthenticated() && window.location.pathname.includes('admin')) {
            window.location.href = 'login.html';
        }
    }
}