import { showView } from "./ui.js";
import { retrieveStorage, updateStorage } from "./storage.js";

// product cards and single product view
// (modules run after the HTML has been parsed, so these elements already exist)
const productDetails = document.querySelector("#productDetails");
const cardTemplate = document.querySelector("#productCard");
const singleTemplate = document.querySelector("#productSingle");
const tagTemplate = document.querySelector("#tagPill");
const specTemplate = document.querySelector("#specRow");
const reviewTemplate = document.querySelector("#reviewItem");

// all products (filled in by app.js once loadProducts() finishes)
const productList = [];

// the API for all product data
const API_URL = "https://dummyjson.com/products";


// loading data
// Use the products saved in localStorage if they are there.
// Otherwise fetch all 100 from the API and save them for next time.
async function loadProducts() {
    let data = retrieveStorage("products");

    if (data.length === 0) {
        const response = await fetch(`${API_URL}?limit=100`);
        if (!response.ok) throw new Error("Fetch failed: " + response.status);

        // the API wraps the array: { products: [...], total, skip, limit }
        const json = await response.json();
        data = json.products;
        updateStorage("products", data);
    }

    return data;
}

// Get one product by id: use the saved list if it has it,
// otherwise fetch just that product from the API.
async function getProduct(id) {
    const found = productList.find(p => p.id == id);
    if (found) return found;

    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) throw new Error("Fetch failed: " + response.status);
    return await response.json();
}


// Featured products: find the 4 categories with the most products,
// then pick the highest-rated product from each of them.
function getFeatured(list) {
    // count how many products are in each category
    const counts = {};
    for (let p of list) {
        counts[p.category] = (counts[p.category] || 0) + 1;
    }

    // the 4 biggest categories
    const categories = [];
    for (let category in counts) {
        categories.push(category);
    }
    categories.sort((a, b) => counts[b] - counts[a]);
    const top4 = categories.slice(0, 4);

    // the highest-rated product in each of those categories
    return top4.map(category => {
        const inCategory = list.filter(p => p.category === category);
        inCategory.sort((a, b) => b.rating - a.rating);
        return inCategory[0];
    });
}

// clear the parent, then add one card per product from the template
function displayProducts(list, parent) {
    parent.replaceChildren();

    for (let p of list) {
        const clone = cardTemplate.content.cloneNode(true);

        const img = clone.querySelector("img");
        img.src = p.thumbnail;
        img.alt = p.title;
        img.dataset.id = p.id;

        clone.querySelector("h3").textContent = p.title;
        // one star and the rating number, e.g. "★ 4.56"
        clone.querySelector(".rating").textContent = `★ ${p.rating.toFixed(2)}`;
        clone.querySelector(".price").textContent = "$" + p.price.toFixed(2);
        clone.querySelector("button").dataset.id = p.id;

        parent.appendChild(clone);
    }
}

// true if the product can't be bought right now
function isOutOfStock(p) {
    return p.stock === 0 || p.availabilityStatus === "Out of Stock";
}

function displayProduct(p) {
    productDetails.replaceChildren();

    const clone = singleTemplate.content.cloneNode(true);

    // breadcrumb: Home > category > title
    clone.querySelector(".crumb-category").textContent = p.category;
    clone.querySelector(".crumb-title").textContent = p.title;

    const img = clone.querySelector("img");
    img.src = p.thumbnail;
    img.alt = p.title;

    clone.querySelector("h2").textContent = p.title;
    clone.querySelector(".sku").textContent = "SKU: " + p.sku;
    clone.querySelector(".rating").textContent = `★ ${p.rating.toFixed(2)}`;

    // one pill per tag
    const tags = clone.querySelector(".tags");
    for (let tag of p.tags) {
        const pill = tagTemplate.content.cloneNode(true);
        pill.querySelector("span").textContent = tag;
        tags.appendChild(pill);
    }

    clone.querySelector(".price").textContent = "$" + p.price.toFixed(2);
    clone.querySelector(".description").textContent = p.description;

    // stock indicator, quantity box and add to cart button
    const stock = clone.querySelector(".stock");
    const quantity = clone.querySelector("#quantity");
    const button = clone.querySelector(".btn-add-single");
    button.dataset.id = p.id;

    if (isOutOfStock(p)) {
        stock.textContent = "Out of stock";
        stock.classList.add("text-red-700");
        // grey out and turn off the button and quantity box
        button.disabled = true;
        button.classList.remove("border-black", "hover:bg-black", "hover:text-white");
        button.classList.add("border-neutral-300", "text-neutral-300", "cursor-not-allowed");
        quantity.disabled = true;
    } else {
        stock.textContent = `In stock (${p.stock} left)`;
        stock.classList.add("text-neutral-500");
        quantity.max = p.stock;
    }

    displaySpecs(clone.querySelector(".specs-body"), p);
    displayReviews(clone.querySelector(".reviews-list"), p);

    productDetails.appendChild(clone);
    showView("product");
}

// fill the specifications table, one row per detail
function displaySpecs(tbody, p) {
    const d = p.dimensions;
    const specs = [
        ["Brand", p.brand || "N/A"],
        ["Category", p.category],
        ["Weight", p.weight + " g"],
        ["Dimensions", `${d.width} x ${d.height} x ${d.depth} cm`],
        ["Warranty", p.warrantyInformation],
        ["Shipping", p.shippingInformation],
        ["Return policy", p.returnPolicy],
        ["Minimum order", p.minimumOrderQuantity]
    ];

    for (let spec of specs) {
        const row = specTemplate.content.cloneNode(true);
        row.querySelector("th").textContent = spec[0];
        row.querySelector("td").textContent = spec[1];
        tbody.appendChild(row);
    }
}

// fill the reviews tab, one block per review
function displayReviews(list, p) {
    if (p.reviews.length === 0) {
        list.textContent = "No reviews yet.";
        return;
    }

    for (let r of p.reviews) {
        const item = reviewTemplate.content.cloneNode(true);
        item.querySelector(".reviewer").textContent = r.reviewerName;
        item.querySelector(".review-stars").textContent = `★ ${r.rating}`;
        item.querySelector(".review-date").textContent = new Date(r.date).toLocaleDateString();
        item.querySelector(".comment").textContent = r.comment;
        list.appendChild(item);
    }
}

// switch between the Specifications and Reviews tabs (event delegation)
productDetails.addEventListener("click", (e) => {
    if (e.target.classList.contains("tab-btn")) {
        const tab = e.target.dataset.tab;

        // underline the chosen tab, grey out the other one
        for (let btn of productDetails.querySelectorAll(".tab-btn")) {
            if (btn.dataset.tab === tab) {
                btn.classList.remove("border-transparent", "text-neutral-400");
                btn.classList.add("border-neutral-900", "text-neutral-900");
            } else {
                btn.classList.remove("border-neutral-900", "text-neutral-900");
                btn.classList.add("border-transparent", "text-neutral-400");
            }
        }

        for (let panel of productDetails.querySelectorAll(".tab-panel")) {
            if (panel.dataset.tab === tab) {
                panel.classList.remove("hidden");
            } else {
                panel.classList.add("hidden");
            }
        }
    }
});

export { productList, loadProducts, getProduct, getFeatured, displayProducts, displayProduct };
