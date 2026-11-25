// view switching and snackbar
// (modules run after the HTML has been parsed, so these elements already exist)
const views = document.querySelectorAll(".view");
const snackbar = document.querySelector("#snackbar");

// show the section with id NAME + "View" and hide all the others
function showView(name) {
    for (let view of views) {
        if (view.id === name + "View") {
            view.classList.remove("hidden");
        } else {
            view.classList.add("hidden");
        }
    }
    window.scrollTo(0, 0);
}

// show a short message for 3 seconds instead of using alert()
function showSnackBar(message) {
    snackbar.textContent = message;
    snackbar.classList.remove("hidden");
    setTimeout(() => {
        snackbar.classList.add("hidden");
    }, 3000);
}

export { showView, showSnackBar };
