// Load products.json and display the first 20 products from the array.
const MAX_PRODUCTS = 20;
const container = document.getElementById('products');

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product';

  // Clicking the thumbnail shows the product ID.
  const img = document.createElement('img');
  img.src = product.thumbnail;
  img.alt = product.title;
  img.addEventListener('click', () => {
    alert('Product ID: ' + product.id);
  });

  const title = document.createElement('h3');
  title.textContent = product.title;

  const price = document.createElement('p');
  price.textContent = '$' + product.price.toFixed(2);

  // Clicking "Add to cart" shows the product ID and title.
  const button = document.createElement('button');
  button.textContent = 'Add to cart';
  button.addEventListener('click', () => {
    alert('Added to cart\nID: ' + product.id + '\nTitle: ' + product.title);
  });

  card.append(img, title, price, button);
  return card;
}

async function init() {
  try {
    const res = await fetch('data/9d780449-data-minifed.json');
    if (!res.ok) throw new Error('Could not load the product data (HTTP ' + res.status + ')');
    const data = await res.json();

    data.products.slice(0, MAX_PRODUCTS).forEach((product) => {
      container.appendChild(createProductCard(product));
    });
  } catch (err) {
    container.textContent = 'Sorry, the products could not be loaded.';
    console.error(err);
  }
}

init();