import { productList, displayProducts } from "./products.js";

// browse: filters and sorting
// (modules run after the HTML has been parsed, so these elements already exist)
const products = document.querySelector("#products");
const filtersAside = document.querySelector("#filters");
const searchName = document.querySelector("#searchName");
const activeFiltersDiv = document.querySelector("#activeFilters");
const categoryList = document.querySelector("#categoryList");
const ratingOptions = document.querySelector("#ratingOptions");
const priceMinInput = document.querySelector("#priceMinInput");
const priceMaxInput = document.querySelector("#priceMaxInput");
const sortBy = document.querySelector("#sortBy");
const resultCount = document.querySelector("#resultCount");
const noMatches = document.querySelector("#noMatches");

// checked categories, stored as strings such as "category:beauty".
// A Set only adds a value if it isn't already there, so the same
// filter can't be added twice.
const activeFilters = new Set();

// build a checkbox for each category; a Set keeps only the unique categories
function displayCategoryList() {
    const categories = new Set();
    for (let p of productList) {
        categories.add(p.category);
    }

    categoryList.replaceChildren();
    for (let category of categories) {
        // the label wraps the checkbox so clicking the text also ticks it
        const label = document.createElement("label");
        label.classList.add("flex", "items-center", "gap-2", "cursor-pointer", "capitalize");

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.classList.add("category-check");
        checkbox.dataset.filter = "category:" + category;

        const span = document.createElement("span");
        span.textContent = category;

        label.appendChild(checkbox);
        label.appendChild(span);
        categoryList.appendChild(label);
    }
}

// highest price in the data (rounded up), used as the default "to" price
let highestPrice = 0;

// fill the "to" price box with the most expensive product's price
function setupPriceInputs() {
    let highest = 0;
    for (let p of productList) {
        if (p.price > highest) highest = p.price;
    }
    highestPrice = Math.ceil(highest);
    priceMinInput.max = highestPrice;
    priceMaxInput.max = highestPrice;
    priceMaxInput.value = highestPrice;
}

// read a price box as a number; an empty box means no limit on that side
function lowestPrice() {
    if (priceMinInput.value === "") return 0;
    return Number(priceMinInput.value);
}
function highestAllowed() {
    if (priceMaxInput.value === "") return highestPrice;
    return Number(priceMaxInput.value);
}

// the number of stars picked in the rating options (0 means any rating)
function selectedRating() {
    return Number(ratingOptions.querySelector("input:checked").value);
}

// keep the boxes tidy when the user leaves one: no negatives,
// nothing above the highest price, and "from" no bigger than "to"
function fixPriceInputs(changed) {
    let low = lowestPrice();
    let high = highestAllowed();

    // keep both prices between 0 and the highest price
    if (low < 0) low = 0;
    if (high < 0) high = 0;
    if (low > highestPrice) low = highestPrice;
    if (high > highestPrice) high = highestPrice;

    // if "from" passed "to", move the other box to match

    if (low > high) {
        if (changed === priceMinInput) {
            high = low;
        } else {
            low = high;
        }
    }
    priceMinInput.value = low;
    priceMaxInput.value = high;
}

// true if the price boxes have been changed from the full range
function priceInUse() {
    return lowestPrice() > 0 || highestAllowed() < highestPrice;
}

// true if a product passes the name search AND every active filter
function matchesFilters(p) {
    const word = searchName.value.trim().toLowerCase();
    if (word && !p.title.toLowerCase().includes(word)) return false;

    // every checked category must match
    for (let filter of activeFilters) {
        const category = filter.split(":")[1];
        if (p.category !== category) return false;
    }

    // rating (rounded to whole stars, like the stars on the cards)
    // must be at least the number of stars picked
    if (Math.round(p.rating) < selectedRating()) return false;

    // price must be between the two price boxes
    if (p.price < lowestPrice() || p.price > highestAllowed()) return false;

    return true;
}

// return a sorted copy of the list based on the sort by dropdown
function sortProducts(list) {
    const sorted = [...list];
    const choice = sortBy.value;

    if (choice === "name") {
        sorted.sort((a, b) => a.title < b.title ? -1 : 1);
    } else if (choice === "priceLow") {
        sorted.sort((a, b) => a.price - b.price);
    } else if (choice === "priceHigh") {
        sorted.sort((a, b) => b.price - a.price);
    } else if (choice === "category") {
        // by category, then by name inside each category
        sorted.sort((a, b) => {
            if (a.category === b.category) return a.title < b.title ? -1 : 1;
            return a.category < b.category ? -1 : 1;
        });
    } else if (choice === "rating") {
        sorted.sort((a, b) => b.rating - a.rating);
    }
    return sorted;
}

// make one removable chip for the Filters section
function createChip(text, filter) {
    const chip = document.createElement("button");
    chip.classList.add("chip", "border", "border-neutral-300", "rounded-full", "px-3", "py-0.5", "hover:border-neutral-900", "hover:text-neutral-900");
    chip.dataset.filter = filter;
    chip.textContent = text + " X";
    return chip;
}

// draw the chips and tick the matching checkboxes
function displayActiveFilters() {
    activeFiltersDiv.replaceChildren();

    for (let filter of activeFilters) {
        activeFiltersDiv.appendChild(createChip(filter.split(":")[1], filter));
    }


    // rating gets a chip once a number of stars is picked
    const stars = selectedRating();
    if (stars === 5) {
        activeFiltersDiv.appendChild(createChip("5 stars", "rating"));
    } else if (stars > 0) {
        activeFiltersDiv.appendChild(createChip(stars + " stars & up", "rating"));
    }

    // price only gets a chip once a box has been changed
    if (priceInUse()) {
        activeFiltersDiv.appendChild(createChip(`$${lowestPrice()} to $${highestAllowed()}`, "price"));
    }

    if (activeFiltersDiv.children.length === 0) {
        activeFiltersDiv.textContent = "No filters selected.";
    }

    // a checkbox is ticked only if its category is in the Set
    for (let checkbox of categoryList.querySelectorAll(".category-check")) {
        checkbox.checked = activeFilters.has(checkbox.dataset.filter);
    }
}

// filter, then sort, then redraw the browse list
// (called every time a filter or the sort changes, so neither resets the other)
function updateBrowse() {
    const matches = productList.filter(p => matchesFilters(p));
    const sorted = sortProducts(matches);

    displayProducts(sorted, products);
    displayActiveFilters();
    resultCount.textContent = `Showing ${sorted.length} of ${productList.length} products`;

    if (sorted.length === 0) {
        noMatches.classList.remove("hidden");
    } else {
        noMatches.classList.add("hidden");
    }
}

// put the price boxes back to the full range
function resetPrice() {
    priceMinInput.value = 0;
    priceMaxInput.value = highestPrice;
}

// set the rating back to "Any rating"
function resetRating() {
    ratingOptions.querySelector('input[value="0"]').checked = true;
}

// add all the browse listeners (called once from app.js)
function setupBrowseListeners() {
    // one click listener on the department column (event delegation)
    filtersAside.addEventListener("click", (e) => {
        // open or close an accordion section and turn its arrow
        if (e.target.classList.contains("accordion-btn")) {
            e.target.parentNode.querySelector(".accordion-body").classList.toggle("hidden");
            e.target.querySelector(".accordion-icon").classList.toggle("-scale-y-100");
        }

        // remove one filter by clicking its chip
        if (e.target.classList.contains("chip")) {
            const filter = e.target.dataset.filter;
            if (filter === "rating") {
                resetRating();
            } else if (filter === "price") {
                resetPrice();
            } else {
                activeFilters.delete(filter);
            }
            updateBrowse();
        }

        // remove every filter and clear the name search
        if (e.target.id === "clearFilters") {
            activeFilters.clear();
            searchName.value = "";
            resetRating();
            resetPrice();
            updateBrowse();
        }
    });

    // ticking a category checkbox adds it to the Set, unticking removes it
    categoryList.addEventListener("change", (e) => {
        if (e.target.classList.contains("category-check")) {
            if (e.target.checked) {
                activeFilters.add(e.target.dataset.filter);
            } else {
                activeFilters.delete(e.target.dataset.filter);
            }
            updateBrowse();
        }
    });

    // picking a rating updates the list
    ratingOptions.addEventListener("change", () => {
        updateBrowse();
    });

    // typing a price updates the list straight away (event delegation)
    filtersAside.addEventListener("input", (e) => {
        if (e.target.classList.contains("price-input")) {
            updateBrowse();
        }
    });

    // when the user leaves a price box, tidy it up; only redraw if a value
    // had to change (redrawing here would swallow a click on a filter chip)
    filtersAside.addEventListener("change", (e) => {
        if (e.target.classList.contains("price-input")) {
            const before = priceMinInput.value + "-" + priceMaxInput.value;
            fixPriceInputs(e.target);
            if (priceMinInput.value + "-" + priceMaxInput.value !== before) {
                updateBrowse();
            }
        }
    });

    // update the list as the user types a name
    searchName.addEventListener("input", () => {
        updateBrowse();
    });

    // re-sort without touching the filters
    sortBy.addEventListener("change", () => {
        updateBrowse();
    });
}

export { displayCategoryList, setupPriceInputs, updateBrowse, setupBrowseListeners };
