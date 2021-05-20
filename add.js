const txtName = document.getElementById("productName");
const txtPrice = document.getElementById("productPrice");
const txtBrand = document.getElementById("productBrand");
const btnAdd = document.getElementById("add");
btnAdd.addEventListener('click', addProduct);

products = [];
class Product{
    constructor(n, p, b){
        this.name = n;
        this.price = p;
		this.brand = b;
    }
}

function addProduct(event){
    event.preventDefault();
    let name = txtName.value.trim();
    let price = txtPrice.value.trim();
	let brand = txtBrand.value.trim()

    let validationMsg = validate(name, price);
    if (validationMsg != ''){
        alert(validationMsg);
        return;
    }
    
    let product = new Product(name, parseFloat(price), brand);
	let url = 'http://127.0.0.1:3000/addProduct?name=' + product.name + '&price=' + product.price + '&brand=' + product.brand;
	
	var addProduct = new XMLHttpRequest();
	addProduct.onreadystatechange = function() {
	  if (this.readyState == 4 && this.status == 200 && this.responseText != "") {
		console.log(this.responseText);		
	  } 
	}
	addProduct.open("POST", url, true);
	addProduct.send();
	
    prepareForm();
}

function prepareForm(){
    txtName.value='';
    txtPrice.value='';
	txtBrand.value='';
    txtName.focus();
}

function validate(name, price){
    if (name === '') return 'Product name is needed';
    if (price === '') return `Price is needed for ${name}`;
    if (isNaN(price)) return 'A valid price is needed';
    return '';
}
