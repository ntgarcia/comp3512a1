import { showView, showSnackBar } from "./ui.js";
import { productList, loadProducts, getProduct, getFeatured, displayProducts, displayProduct } from "./products.js";
import { addToCart, displayCart, setupCartListeners } from "./cart.js";
import { displayCategoryList, setupPriceInputs, updateBrowse, setupBrowseListeners } from "./browse.js";
import { startHeroImages } from "./hero.js";

// main file: wires up the page and loads the data.
// The other files in js/ each handle one part of the page:
// ui.js - view switching and the snackbar
// products.js - product cards and the single product view
// browse.js - browse filters and sorting
// cart.js - shopping cart
// storage.js - localStorage helpers
// hero.js - floating product images behind the home page hero (GSAP)
document.addEventListener("DOMContentLoaded", () => {

    // element references
    const nav = document.querySelector("nav");
    const main = document.querySelector("main");
    const featured = document.querySelector("#featured");
    const aboutDialog = document.querySelector("#aboutDialog");


    // view switching
    // one listener on the nav handles every data-view link (event delegation)
    nav.addEventListener("click", (e) => {
        if (e.target.dataset.view) {
            e.preventDefault();
            showView(e.target.dataset.view);
        }
    });


    // about us (pop up dialog)
    document.querySelector("#aboutLink").addEventListener("click", (e) => {
        e.preventDefault();
        aboutDialog.showModal();
    });

    document.querySelector("#aboutClose").addEventListener("click", () => {
        aboutDialog.close();
    });

    // close the dialog when clicking the dark area outside it
    aboutDialog.addEventListener("click", (e) => {
        if (e.target === aboutDialog) aboutDialog.close();
    });


    // product clicks
    // one listener on main handles clicks on every card and the single
    // product view, including cards added later by the fetch (event delegation)
    main.addEventListener("click", (e) => {
        // buttons inside a view with data-view (like "Shop now") switch views
        if (e.target.dataset.view) {
            showView(e.target.dataset.view);
        }

        // clicking a card image opens the single product view
        if (e.target.classList.contains("product-img")) {
            getProduct(e.target.dataset.id)
                .then(p => displayProduct(p))
                .catch(error => {
                    console.error(error);
                    showSnackBar("Sorry, that product could not be loaded.");
                });
        }

        // clicking "Add to cart" on a product card adds one
        if (e.target.classList.contains("btn-add")) {
            const p = productList.find(p => p.id == e.target.dataset.id);
            addToCart(p, 1);
        }

        // clicking "Add to cart" on the single product view adds the chosen quantity
        if (e.target.classList.contains("btn-add-single")) {
            const quantity = Number(document.querySelector("#quantity").value);
            if (quantity < 1) {
                showSnackBar("Please choose a quantity of at least 1.");
                return;
            }
            getProduct(e.target.dataset.id)
                .then(p => addToCart(p, quantity))
                .catch(error => console.error(error));
        }
    });


    // browse filters and sorting
    setupBrowseListeners();


    // shopping cart
    setupCartListeners();


    // load data
    displayCart();

    // load the products (from localStorage, or the API the first time),
    // then draw the browse list and featured products
    loadProducts()
        .then(data => {
            productList.push(...data);
            displayCategoryList();
            setupPriceInputs();
            updateBrowse();
            displayProducts(getFeatured(productList), featured);
            startHeroImages(productList);
            displayCart(); // redraw so older cart items can find their thumbnails
        })
        .catch(error => {
            console.error(error);
            showSnackBar("Sorry, the products could not be loaded.");
        });
});
