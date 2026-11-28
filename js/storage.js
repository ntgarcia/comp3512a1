// local Storage
// Data is saved as JSON string under a key ("cart" or "products").

// retrieve from storage or return empty array if doesn't exist
function retrieveStorage(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

// update storage with revised collection
function updateStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

export { retrieveStorage, updateStorage };
