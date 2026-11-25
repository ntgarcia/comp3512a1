import { retrieveStorage, updateStorage } from "./storage.js";
import { showView, showSnackBar } from "./ui.js";
import { productList } from "./products.js";

// shopping cart
// (modules run after the HTML has been parsed, so these elements already exist)
const cartItems = document.querySelector("#cartItems");
const cartEmpty = document.querySelector("#cartEmpty");
const cartCount = document.querySelector("#cartCount");
const shippingMethod = document.querySelector("#shippingMethod");
const destination = document.querySelector("#destination");
const checkoutBtn = document.querySelector("#checkout");

const summaryMerch = document.querySelector("#summaryMerch");
const summaryShipping = document.querySelector("#summaryShipping");
const summaryTax = document.querySelector("#summaryTax");
const summaryTotal = document.querySelector("#summaryTotal");

// constructor to represent a single cart item
function CartItem(id, title, price, quantity, thumbnail) {
    this.id = id;
    this.title = title;
    this.price = price;
    this.quantity = quantity;
    this.thumbnail = thumbnail;
}

// cart state, loaded from localStorage so it survives a page refresh
let cart = retrieveStorage("cart");

// shipping cost for each method, by destination (ca = Canada, us = United States, intl = International)
const shippingCosts = {
    standard: { ca: 10, us: 15, intl: 20 },
    express: { ca: 25, us: 25, intl: 30 },
    priority: { ca: 35, us: 50, intl: 50 }
};

// add to cart function
function addToCart(p, quantity) {
    // check if item is already in cart
    let foundItem = null;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === p.id) {
            foundItem = cart[i];
        }
    }

    // if in cart, increase quantity
    if (foundItem !== null) {
        foundItem.quantity = foundItem.quantity + quantity;
    } else {
        // if not, create new cart item and add it
        const newItem = new CartItem(p.id, p.title, p.price, quantity, p.thumbnail);
        cart.push(newItem);
    }

    // save and redraw the cart
    updateStorage("cart", cart);
    displayCart();
    showSnackBar(quantity + " x " + p.title + " added to cart");
}

// delete button handler
function deleteItem(e) {
    // convert dataset value to number
    const idToDelete = Number(e.target.dataset.id);

    // find item with id and remove
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === idToDelete) {
            showSnackBar(cart[i].title + " removed from cart");
            cart.splice(i, 1);
            break;
        }
    }

    // save and redraw cart with modified array
    updateStorage("cart", cart);
    displayCart();
}

// find the thumbnail for an item (older cart items didn't save one, so look in the product list)
function getThumbnail(item) {
    if (item.thumbnail) {
        return item.thumbnail;
    }
    for (let i = 0; i < productList.length; i++) {
        if (productList[i].id === item.id) {
            return productList[i].thumbnail;
        }
    }
    return "";
}

// display cart as table rows
function displayCart() {
    // remove whatever is shown
    cartItems.innerHTML = "";

    // build a row for each item
    // <tr>
    //   <td><button class="btn-remove">×</button></td>
    //   <td><img class="product-img"></td>
    //   <td>name</td> <td>price</td> <td>quantity</td> <td>subtotal</td>
    // </tr>
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];

        const row = document.createElement("tr");
        row.classList.add("border-b", "border-neutral-200");

        // column with delete button
        const deleteCell = document.createElement("td");
        deleteCell.classList.add("py-4");
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("btn-remove", "text-lg", "leading-none", "text-neutral-400", "hover:text-neutral-900");
        deleteBtn.textContent = "×";
        deleteBtn.setAttribute("aria-label", "Remove item");

        // store this item's id on the button
        deleteBtn.dataset.id = item.id;
        deleteBtn.addEventListener("click", deleteItem);
        deleteCell.appendChild(deleteBtn);

        // thumbnail (product-img: clicking it opens the product, handled in app.js)
        const imgCell = document.createElement("td");
        imgCell.classList.add("py-4", "pr-4");
        const img = document.createElement("img");
        img.classList.add("product-img", "w-16", "h-16", "object-cover", "bg-neutral-100", "cursor-pointer");
        img.src = getThumbnail(item);
        img.alt = item.title;
        img.dataset.id = item.id;
        imgCell.appendChild(img);

        const nameCell = document.createElement("td");
        nameCell.classList.add("py-4", "pr-4");
        nameCell.textContent = item.title;

        const priceCell = document.createElement("td");
        priceCell.classList.add("py-4", "pr-4", "text-neutral-500");
        priceCell.textContent = "$" + item.price.toFixed(2);

        const quantityCell = document.createElement("td");
        quantityCell.classList.add("py-4", "pr-4");
        quantityCell.textContent = item.quantity;

        const subtotalCell = document.createElement("td");
        subtotalCell.classList.add("py-4", "text-right");
        const lineTotal = item.price * item.quantity;
        subtotalCell.textContent = "$" + lineTotal.toFixed(2);

        row.appendChild(deleteCell);
        row.appendChild(imgCell);
        row.appendChild(nameCell);
        row.appendChild(priceCell);
        row.appendChild(quantityCell);
        row.appendChild(subtotalCell);

        cartItems.appendChild(row);
    }

    // update item count in the header
    let totalItems = 0;
    for (let i = 0; i < cart.length; i++) {
        totalItems = totalItems + cart[i].quantity;
    }
    cartCount.textContent = totalItems;

    // if cart is empty, show message and disable shipping options and checkout
    if (cart.length === 0) {
        cartEmpty.classList.remove("hidden");
        shippingMethod.disabled = true;
        destination.disabled = true;
        checkoutBtn.disabled = true;
    } else {
        cartEmpty.classList.add("hidden");
        shippingMethod.disabled = false;
        destination.disabled = false;
        checkoutBtn.disabled = false;
    }

    displaySummary();
}

// work out merchandise, shipping, tax and total
function displaySummary() {
    // add up price x quantity for every item
    let merchandise = 0;
    for (let i = 0; i < cart.length; i++) {
        merchandise = merchandise + cart[i].price * cart[i].quantity;
    }

    // shipping cost from the two dropdowns, free over $500 (and nothing for an empty cart)
    let shipping = shippingCosts[shippingMethod.value][destination.value];
    if (cart.length === 0 || merchandise > 500) {
        shipping = 0;
    }

    // 5% tax only for Canada
    let tax = 0;
    if (destination.value === "ca") {
        tax = merchandise * 0.05;
    }

    const total = merchandise + shipping + tax;

    // show the numbers
    summaryMerch.textContent = "$" + merchandise.toFixed(2);
    if (shipping === 0 && cart.length > 0) {
        summaryShipping.textContent = "Free";
    } else {
        summaryShipping.textContent = "$" + shipping.toFixed(2);
    }
    summaryTax.textContent = "$" + tax.toFixed(2);
    summaryTotal.textContent = "$" + total.toFixed(2);
}

// checkout button handler
function checkout(e) {
    e.preventDefault();

    // empty array and save
    cart = [];
    updateStorage("cart", cart);

    // redraw, show message and go back to home
    displayCart();
    showSnackBar("Thank you for your order!");
    showView("home");
}

// add event handlers for the dropdowns and checkout button
function setupCartListeners() {
    // changing shipping or destination recalculates the totals
    shippingMethod.addEventListener("change", displaySummary);
    destination.addEventListener("change", displaySummary);

    checkoutBtn.addEventListener("click", checkout);
}

export { addToCart, displayCart, setupCartListeners };
