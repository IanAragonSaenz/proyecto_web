const cart = document.getElementById("cart");
const totalLabel = document.getElementById("total");
const btn = document.getElementById("btn");
btn.addEventListener("click", ()=>{window.location.replace('http://127.0.0.1:3000/add');});
		
products = [];
class Product{
    constructor(i, n, p, b){
		this.id = i;
        this.name = n;
        this.price = p;
		this.brand = b;
    }
}

var getProducts = new XMLHttpRequest();
getProducts.onreadystatechange = function() {
  if (this.readyState == 4 && this.status == 200 && this.responseText != "") {
	//console.log(this.responseText);
	var productData = this.responseText;
	var productData = JSON.parse(productData);
	productData.forEach(prod => {
		let product = new Product(prod._id, prod.name, parseFloat(prod.price), prod.brand);
		addProductToCart(product);
	});		
	updateList();
    updateTotal();
  } 
}
getProducts.open("GET", "http://127.0.0.1:3000/products", true);
getProducts.send();


function updateList(){
    clearCart();
    products.forEach(product =>{
        let li = document.createElement('li');
        let namePart = document.createElement('span');
        namePart.appendChild(document.createTextNode(product.name));
        let pricePart = document.createElement('span');
        pricePart.appendChild(document.createTextNode(`$${product.price}`));
		let brandPart = document.createElement('span');
        brandPart.appendChild(document.createTextNode(`  ${product.brand}  `));

        // complete the remove functionality
        btnRemove = document.createElement("button");
        btnRemove.appendChild(document.createTextNode("Remove"));
        btnRemove.className = "removeButton";
        btnRemove.addEventListener("click", ()=>{
            removeProductFromCart(product);
            cart.removeChild(li);
            updateTotal();
        });
		
		btnEdit = document.createElement("button");
        btnEdit.appendChild(document.createTextNode("Edit"));
        btnEdit.addEventListener("click", ()=>{
			window.location.replace('http://127.0.0.1:3000/' + product.id + '/edit');
        });

        let eguzz = document.createElement('br');
        li.appendChild(namePart);
        li.appendChild(document.createTextNode(': '));
        li.appendChild(pricePart);
        li.appendChild(document.createElement('br'));
        li.appendChild(document.createTextNode('Brand: '));
		li.appendChild(brandPart);
        li.appendChild(eguzz);
        li.appendChild(btnRemove);
		li.appendChild(btnEdit);
        li.appendChild(document.createElement('br'));
        li.appendChild(document.createElement('br'));

        cart.appendChild(li);
    });
}

function removeProductFromCart(product){
    // find the element
    let idx = products.indexOf(product);
	let url = 'http://127.0.0.1:3000/removeProduct/?id=' + product.id;
    
	var deleteProduct = new XMLHttpRequest();
	deleteProduct.onreadystatechange = function() {
	  if (this.readyState == 4 && this.status == 200 && this.responseText != "") {
		console.log(this.responseText);		
	  } 
	}
	deleteProduct.open("POST", url, true);
	deleteProduct.send();
	// remove the element (which position, how many elements)
    products.splice(idx,1);
    
}

function clearCart(){
    while (cart.lastElementChild) cart.removeChild(cart.lastElementChild);
}

function updateTotal(){
    let sum = 0.0;
    products.forEach(p=>sum+=p.price);
    totalLabel.textContent = `Total: $ ${sum}`;
}

function addProductToCart(product){
    products.push(product);
}


function validate(name, price){
    if (name === '') return 'Product name is needed';
    if (price === '') return `Price is needed for ${name}`;
    if (isNaN(price)) return 'A valid price is needed';
    return '';
}

/* probably not needed
function duplicatedProduct(name){
    // productFound = products.find(x => x.name===name);
    // if (product === undefined) then we did not find anything, so the product is not duplicated
    // if (productFound !== undefined) then the product is duplicated
    return products.find(x => x.name===name) !== undefined;
} */
