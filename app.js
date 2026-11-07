// Make cards go in products div in index.html
const container = document.getElementById('products');

// Function to create a product card
function makeCard(product) {
  const card = document.createElement('div');
  card.className = 'product';

  // alert product id when clicking image
  const img = document.createElement('img');
  img.src = product.thumbnail;
  img.alt = product.title;
  img.addEventListener('click', function () {
    alert('Product ID: ' + product.id);
  });

  const title = document.createElement('h3');
  title.textContent = product.title;

  const price = document.createElement('p');
  price.textContent = '$' + product.price.toFixed(2);

  // show id and title when clicking add to cart
  const button = document.createElement('button');
  button.textContent = 'Add to cart';
  button.addEventListener('click', function () {
    alert('Added to cart\nID: ' + product.id + '\nTitle: ' + product.title);
  });

  card.appendChild(img);
  card.appendChild(title);
  card.appendChild(price);
  card.appendChild(button);

  return card;
}

// Load the JSON file, then add the first 20 products to the page.
fetch('data/data-minifed.json')
  .then(function (response) {
    return response.json();
  })
  .then(function (data) {
    for (let i = 0; i < 20; i++) {
      const card = makeCard(data.products[i]);
      container.appendChild(card);
    }
  })
  .catch(function (error) {
    console.error(error);
    container.textContent = 'Sorry, the products could not be loaded.';
  });