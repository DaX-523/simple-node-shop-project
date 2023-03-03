const deleteProduct = btn => {
    const prodId = btn.parentNode.querySelector('[name=productId]').value;
    const csrf = btn.parentNode.querySelector('[name=token]').value;
    const elementToBeRemoved = btn.closest('article');

    fetch('/admin/product/' + prodId, {
        method: 'DELETE',
        headers: {
            'csrf-token': csrf
        }
    })
    .then(result => {
        return result.json();
    })
    .then(data => {
        console.log(data);
        // for its working in internet explorer too
        elementToBeRemoved.parentNode.removeChild(elementToBeRemoved); // or elementToBeRemoved.remove() works in all browsers except IE
    })
    .catch(err => {
        console.log(err);
    })
}